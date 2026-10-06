from django.db import models

class UserLead(models.Model):
    lead_id = models.CharField(max_length=30, unique=True, editable=False)
    full_name = models.CharField(max_length=120, verbose_name="Full Name")
    age = models.PositiveIntegerField(verbose_name="Age")
    gender = models.CharField(max_length=30, verbose_name="Gender")
    source = models.CharField(max_length=60, verbose_name="Heard From")
    mobile = models.CharField(max_length=15, db_index=True, verbose_name="Mobile Number")
    coupon_code = models.CharField(max_length=20, default='NEW50', verbose_name="Coupon Code")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Submission Date & Time")

    class Meta:
        ordering = ['-created_at']
        verbose_name = "User Lead"
        verbose_name_plural = "User Leads"

    def __str__(self):
        return f"{self.full_name} ({self.mobile}) - {self.coupon_code}"
