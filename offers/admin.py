from django.contrib import admin
from .models import UserLead

@admin.register(UserLead)
class UserLeadAdmin(admin.ModelAdmin):
    list_display = ('lead_id', 'full_name', 'age', 'gender', 'source', 'mobile', 'coupon_code', 'created_at')
    search_fields = ('full_name', 'mobile', 'source', 'gender')
    list_filter = ('gender', 'source', 'created_at')
    readonly_fields = ('lead_id', 'created_at')
