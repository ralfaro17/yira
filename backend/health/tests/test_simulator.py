import io

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase

from health.models import Alert, CrewMember


class SimulatorTests(TestCase):
    def test_scenarios_produce_alerts(self):
        call_command(
            "simulate_mission",
            crew=3,
            days=8,
            interval="15m",
            seed=7,
            stdout=io.StringIO(),
        )
        user = User.objects.get(username="demo")
        crew = list(CrewMember.objects.filter(owner=user).order_by("id"))
        self.assertEqual(len(crew), 3)

        def has(member, **kw):
            return Alert.objects.filter(crew_member=member, **kw).exists()

        self.assertTrue(has(crew[0], metric="body_temp", kind="threshold"), "fever")
        self.assertTrue(
            has(crew[2], metric="spo2", severity="critical"), "desaturation"
        )
        self.assertTrue(has(crew[1], metric="sleep_duration"), "sleep loss")
        for member in crew:
            self.assertTrue(
                has(member, metric="radiation_dose", severity="critical"),
                "solar particle event",
            )
            self.assertTrue(has(member, metric="cabin_co2"), "CO2 build-up")

        # Every alert covers at least one breach and episodes never run backwards.
        for a in Alert.objects.all():
            self.assertGreaterEqual(a.occurrences, 1)
            self.assertGreaterEqual(a.last_seen_at, a.triggered_at)
