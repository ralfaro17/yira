import io

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase

from health import services
from health.models import Alert, CrewMember


class SimulatorTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command(
            "simulate_mission", days=8, interval="15m", seed=7, stdout=io.StringIO()
        )
        cls.user = User.objects.get(username="demo")
        cls.crew = {c.name: c for c in CrewMember.objects.filter(owner=cls.user)}

    def has(self, name, **kw):
        return Alert.objects.filter(crew_member=self.crew[name], **kw).exists()

    def test_design_crew_created(self):
        self.assertEqual(set(self.crew), {"Álvaro", "Rosa", "Mateo"})
        self.assertEqual(self.crew["Rosa"].age, 38)
        self.assertEqual(self.crew["Mateo"].photo, "/crew/mateo.png")

    def test_statuses_match_design(self):
        statuses = {
            name: services.crew_systems(c)["status"] for name, c in self.crew.items()
        }
        self.assertEqual(
            statuses, {"Álvaro": "stable", "Rosa": "observation", "Mateo": "critical"}
        )

    def test_scenarios_produce_alerts(self):
        self.assertTrue(
            self.has("Mateo", metric="body_temp", kind="threshold"), "fever"
        )
        self.assertTrue(self.has("Mateo", metric="sleep_duration"), "sleep loss")
        self.assertTrue(self.has("Rosa", metric="systolic_bp"), "cardio episode")
        for name in self.crew:
            self.assertTrue(
                self.has(name, metric="radiation_dose", severity="critical"), "SPE"
            )
            self.assertTrue(self.has(name, metric="cabin_co2"), "CO2 build-up")

    def test_alert_episodes_are_consistent(self):
        for a in Alert.objects.all():
            self.assertGreaterEqual(a.occurrences, 1)
            self.assertGreaterEqual(a.last_seen_at, a.triggered_at)
