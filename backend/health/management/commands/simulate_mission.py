from datetime import timedelta

import pandas as pd
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from health import services
from health.analysis.frames import parse_duration
from health.models import Alert, CrewMember, Measurement
from health.simulation import DEFAULT_CREW, SCENARIOS, generate_crew_frame


class Command(BaseCommand):
    help = "Generate a synthetic mission (crew + telemetry) and run it through the alerting pipeline."

    def add_arguments(self, parser):
        parser.add_argument(
            "--user", default="demo", help="Owner username (created if missing)."
        )
        parser.add_argument(
            "--password",
            default="demo-password-123",
            help="Password if the user is created.",
        )
        parser.add_argument(
            "--email", default="demo@example.com", help="Email if the user is created."
        )
        parser.add_argument("--mission", default="Misión a Marte")
        parser.add_argument("--crew", type=int, default=3)
        parser.add_argument("--days", type=int, default=14)
        parser.add_argument(
            "--interval", default="5m", help="Sampling interval for high-rate vitals."
        )
        parser.add_argument("--seed", type=int, default=42)
        parser.add_argument(
            "--chunk", default="1d", help="Ingest batch size (simulated downlink)."
        )
        parser.add_argument(
            "--scenarios",
            default=",".join(SCENARIOS),
            help="Comma-separated, or 'none'.",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete this user's crew for this mission first.",
        )

    def handle(self, *args, **opts):
        if not 1 <= opts["crew"] <= len(DEFAULT_CREW):
            raise CommandError(f"--crew must be between 1 and {len(DEFAULT_CREW)}")
        if opts["days"] < 1:
            raise CommandError("--days must be >= 1")
        scenarios = (
            ()
            if opts["scenarios"] == "none"
            else tuple(s.strip() for s in opts["scenarios"].split(","))
        )
        if bad := [s for s in scenarios if s not in SCENARIOS]:
            raise CommandError(f"Unknown scenarios: {bad}. Choose from {SCENARIOS}")
        try:
            interval, chunk = (
                parse_duration(opts["interval"]),
                parse_duration(opts["chunk"]),
            )
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=opts["user"], defaults={"email": opts["email"]}
        )
        if created:
            user.set_password(opts["password"])
            user.save()
            self.stdout.write(
                f"Created user '{user.username}' with the given password."
            )

        if opts["reset"]:
            deleted, _ = CrewMember.objects.filter(
                owner=user, mission=opts["mission"]
            ).delete()
            self.stdout.write(f"Reset: deleted {deleted} objects.")

        start = (timezone.now() - timedelta(days=opts["days"])).replace(
            minute=0, second=0, microsecond=0
        )
        for i, profile in enumerate(DEFAULT_CREW[: opts["crew"]]):
            crew = CrewMember.objects.create(
                owner=user,
                name=profile.name,
                mission=opts["mission"],
                role=profile.role,
                sex=profile.sex,
                photo=profile.photo,
                date_of_birth=profile.date_of_birth(),
            )
            frame = generate_crew_frame(
                profile, i, start, opts["days"], interval, opts["seed"], scenarios
            )
            n_alerts = 0
            for _, batch in frame.groupby(
                frame["recorded_at"].dt.floor(pd.Timedelta(chunk)), sort=True
            ):
                result = services.ingest_measurements(
                    crew, batch.to_dict("records"), Measurement.Source.SIMULATED
                )
                n_alerts += len(result["alerts"])
            status = services.crew_systems(crew)
            scores = ", ".join(
                f"{sys['key']}={sys['score']}" for sys in status["systems"]
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"{crew.name}: {len(frame)} measurements, {n_alerts} alerts, "
                    f"status={status['status']} ({scores})"
                )
            )

        summary = Alert.objects.filter(
            crew_member__owner=user, crew_member__mission=opts["mission"]
        )
        by = {}
        for a in summary.values_list("kind", "severity", "metric"):
            by[a] = by.get(a, 0) + 1
        for (kind, sev, metric), n in sorted(by.items()):
            self.stdout.write(f"  {sev:8} {kind:10} {metric:16} x{n}")
