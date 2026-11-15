import json
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from health.models import Alert, CrewMember, Measurement

AUTH = "/_allauth/browser/v1/auth"


class AuthTests(TestCase):
    def test_signup_login_session_logout(self):
        r = self.client.post(
            f"{AUTH}/signup",
            json.dumps(
                {
                    "username": "astro",
                    "email": "astro@example.com",
                    "password": "Sup3r-secret-pw",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 200, r.content)
        self.assertTrue(User.objects.filter(username="astro").exists())

        self.assertEqual(
            self.client.get("/api/health/crew/").status_code, 200
        )  # session works with DRF
        self.assertEqual(
            self.client.delete(f"{AUTH}/session").status_code, 401
        )  # logged out
        self.assertEqual(self.client.get("/api/health/crew/").status_code, 403)

        for login in ({"username": "astro"}, {"email": "astro@example.com"}):
            r = self.client.post(
                f"{AUTH}/login",
                json.dumps({**login, "password": "Sup3r-secret-pw"}),
                content_type="application/json",
            )
            self.assertEqual(r.status_code, 200, r.content)
            self.assertEqual(self.client.get(f"{AUTH}/session").status_code, 200)
            self.client.delete(f"{AUTH}/session")

    def test_bad_password(self):
        User.objects.create_user("astro", "astro@example.com", "Sup3r-secret-pw")
        r = self.client.post(
            f"{AUTH}/login",
            json.dumps({"username": "astro", "password": "nope"}),
            content_type="application/json",
        )
        self.assertEqual(r.status_code, 400)

    def test_csrf_endpoint_sets_cookie(self):
        r = self.client.get("/api/csrf/")
        self.assertIn("csrftoken", r.cookies)


class HealthApiTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("surgeon", "s@example.com", "pw-12345678")
        self.other = User.objects.create_user("other", "o@example.com", "pw-12345678")
        self.client = APIClient()
        self.client.force_login(self.user)
        self.crew = CrewMember.objects.create(
            owner=self.user, name="A. Rivera", mission="Test"
        )
        self.t0 = timezone.now().replace(microsecond=0) - timedelta(days=5)

    def url(self, suffix=""):
        return f"/api/health/crew/{self.crew.id}/{suffix}"

    def post_measurements(self, rows):
        return self.client.post(
            self.url("measurements/"), {"measurements": rows}, format="json"
        )

    def test_requires_auth(self):
        self.assertEqual(APIClient().get("/api/health/crew/").status_code, 403)
        self.assertEqual(APIClient().get("/api/health/metrics/").status_code, 200)

    def test_crew_crud_scoped_to_owner(self):
        r = self.client.post(
            "/api/health/crew/", {"name": "K. Tanaka", "mission": "Test"}, format="json"
        )
        self.assertEqual(r.status_code, 201)
        self.assertEqual(CrewMember.objects.get(id=r.data["id"]).owner, self.user)
        other = APIClient()
        other.force_login(self.other)
        self.assertEqual(other.get(self.url()).status_code, 404)
        self.assertEqual(other.get(self.url("risk/")).status_code, 404)
        self.assertEqual(other.get("/api/health/alerts/").data["count"], 0)

    def test_ingest_creates_threshold_alerts_and_folds_episodes(self):
        rows = [
            {
                "metric": "spo2",
                "value": 88,
                "recorded_at": (self.t0 + timedelta(minutes=5 * i)).isoformat(),
            }
            for i in range(6)
        ] + [{"metric": "body_temp", "value": 36.8, "recorded_at": self.t0.isoformat()}]
        r = self.post_measurements(rows)
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(r.data["created"], 7)
        alerts = Alert.objects.filter(crew_member=self.crew, metric="spo2")
        self.assertEqual(alerts.count(), 1)  # one episode, not one per sample
        self.assertEqual(alerts.get().severity, "critical")
        self.assertEqual(alerts.get().occurrences, 5)  # first sample is the alarm delay

    def test_single_sample_blip_is_ignored(self):
        self.post_measurements(
            [
                {
                    "metric": "heart_rate",
                    "value": 160,
                    "recorded_at": self.t0.isoformat(),
                },
                {
                    "metric": "heart_rate",
                    "value": 70,
                    "recorded_at": (self.t0 + timedelta(minutes=5)).isoformat(),
                },
            ]
        )
        self.assertFalse(Alert.objects.filter(metric="heart_rate").exists())

    def test_radiation_rate_alert(self):
        rows = [
            {
                "metric": "radiation_dose",
                "value": 10,
                "recorded_at": (self.t0 + timedelta(hours=h)).isoformat(),
            }
            for h in range(6)
        ]
        self.post_measurements(rows)
        alert = Alert.objects.get(metric="radiation_dose", kind="threshold")
        self.assertEqual(alert.severity, "critical")  # 60 mSv in 24 h

    def test_validation(self):
        r = self.post_measurements(
            [{"metric": "mood", "value": 1, "recorded_at": self.t0.isoformat()}]
        )
        self.assertEqual(r.status_code, 400)
        r = self.client.post(
            self.url("measurements/"), {"measurements": []}, format="json"
        )
        self.assertEqual(r.status_code, 400)

    def test_csv_upload(self):
        csv = b"recorded_at,heart_rate,spo2\n2026-01-01T00:00:00Z,60,97\n2026-01-01T00:05:00Z,61,98\n"
        r = self.client.post(
            self.url("measurements/upload/"),
            {"file": SimpleUploadedFile("vitals.csv", csv, content_type="text/csv")},
            format="multipart",
        )
        self.assertEqual(r.status_code, 201, r.data)
        self.assertEqual(
            Measurement.objects.filter(crew_member=self.crew, source="csv").count(), 4
        )
        bad = self.client.post(
            self.url("measurements/upload/"),
            {"file": SimpleUploadedFile("x.csv", b"recorded_at,mood\n2026-01-01,1\n")},
            format="multipart",
        )
        self.assertEqual(bad.status_code, 400)

    def test_analysis_endpoints(self):
        rows = []
        for i in range(5 * 24):
            t = self.t0 + timedelta(hours=i)
            rows += [
                {
                    "metric": "heart_rate",
                    "value": 60 + (i % 3),
                    "recorded_at": t.isoformat(),
                },
                {"metric": "systolic_bp", "value": 115, "recorded_at": t.isoformat()},
                {"metric": "diastolic_bp", "value": 75, "recorded_at": t.isoformat()},
            ]
        self.post_measurements(rows)

        r = self.client.get(
            self.url("summary/"), {"window": "2d", "metric": "heart_rate"}
        )
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["metrics"][0]["count"], 49)
        self.assertAlmostEqual(
            r.data["derived"]["mean_arterial_pressure"]["latest"], (115 + 150) / 3
        )

        r = self.client.get(
            self.url("timeseries/"),
            {"metric": "heart_rate", "resolution": "6h", "window": "1d"},
        )
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.data["series"]["heart_rate"]["points"])

        self.assertEqual(
            self.client.get(
                self.url("anomalies/"), {"metric": "heart_rate"}
            ).status_code,
            200,
        )
        self.assertEqual(self.client.get(self.url("trends/")).status_code, 200)

        r = self.client.get(self.url("risk/"))
        self.assertEqual(r.status_code, 200)
        self.assertTrue(0 <= r.data["score"] <= 100)

        r = self.client.get("/api/health/dashboard/")
        self.assertEqual(r.data["crew"][0]["latest"]["heart_rate"]["status"], "normal")

        self.assertEqual(
            self.client.get(self.url("summary/"), {"window": "forever"}).status_code,
            400,
        )
        self.assertEqual(
            self.client.get(
                self.url("timeseries/"), {"resolution": "7min"}
            ).status_code,
            400,
        )

    def test_acknowledge_alert(self):
        self.post_measurements(
            [
                {
                    "metric": "body_temp",
                    "value": 40,
                    "recorded_at": self.t0.isoformat(),
                },
            ]
        )
        alert = Alert.objects.get(crew_member=self.crew)
        r = self.client.patch(
            f"/api/health/alerts/{alert.id}/", {"acknowledged": True}, format="json"
        )
        self.assertEqual(r.status_code, 200)
        alert.refresh_from_db()
        self.assertTrue(alert.acknowledged)
        self.assertEqual(alert.acknowledged_by, self.user)
        r = self.client.get("/api/health/alerts/", {"acknowledged": "false"})
        self.assertEqual(r.data["count"], 0)
        self.assertEqual(
            self.client.delete(f"/api/health/alerts/{alert.id}/").status_code, 405
        )
