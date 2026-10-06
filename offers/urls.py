from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('api/claim-coupon/', views.claim_coupon_api, name='claim_coupon_api'),
    path('api/admin-auth/', views.admin_auth_api, name='admin_auth_api'),
    path('api/get-leads/', views.get_leads_api, name='get_leads_api'),
    path('api/export-csv/', views.export_leads_csv, name='export_leads_csv'),
    path('api/clear-leads/', views.clear_leads_api, name='clear_leads_api'),
]
