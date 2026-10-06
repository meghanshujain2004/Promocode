import csv
import json
import re
import time
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from .models import UserLead

ADMIN_PASSCODE = '887854'

def index_view(request):
    """Renders the main Myntra offer page."""
    return render(request, 'offers/index.html')

def is_valid_mobile(phone):
    """Strict backend verification for mobile numbers."""
    clean_phone = re.sub(r'\D', '', str(phone).strip())
    
    if len(clean_phone) != 10:
        return False
    
    if not clean_phone[0] in ['6', '7', '8', '9']:
        return False
    
    # Reject all identical digits (9999999999, 8888888888)
    if len(set(clean_phone)) == 1:
        return False
    
    dummy_sequences = [
        '1234567890', '0123456789', '9876543210', '8765432109',
        '9876543211', '1234512345', '9876598765', '0000000000',
        '9999900000', '1234567899'
    ]
    if clean_phone in dummy_sequences:
        return False
        
    return True

@csrf_exempt
def claim_coupon_api(request):
    """Backend API to save user lead into MySQL database and return coupon code."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid HTTP method'}, status=405)

    try:
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST

        full_name = data.get('fullName', '').strip()
        age_str = str(data.get('age', '')).strip()
        gender = data.get('gender', '').strip()
        source = data.get('source', '').strip()
        mobile = data.get('mobile', '').strip()
        coupon_code = data.get('couponCode', 'BFF50').strip()

        # Validation
        if not full_name or len(full_name) < 2:
            return JsonResponse({'success': False, 'error': 'Please enter a valid full name.'}, status=400)

        try:
            age = int(age_str)
            if age < 10 or age > 120:
                raise ValueError()
        except ValueError:
            return JsonResponse({'success': False, 'error': 'Please enter a valid age between 10 and 120.'}, status=400)

        if not gender:
            return JsonResponse({'success': False, 'error': 'Please select your gender.'}, status=400)

        if not source:
            return JsonResponse({'success': False, 'error': 'Please select where you heard about us.'}, status=400)

        if not is_valid_mobile(mobile):
            return JsonResponse({
                'success': False,
                'error': 'Invalid mobile number! Must be a valid 10-digit number starting with 6-9 (fake numbers rejected).'
            }, status=400)

        # Generate Unique Lead ID
        lead_id = f"LD-{int(time.time() * 1000)}"

        # Save record directly to MySQL database table
        lead = UserLead.objects.create(
            lead_id=lead_id,
            full_name=full_name,
            age=age,
            gender=gender,
            source=source,
            mobile=mobile,
            coupon_code=coupon_code
        )

        return JsonResponse({
            'success': True,
            'code': coupon_code,
            'lead_id': lead.lead_id,
            'message': f'Details verified! Your coupon code is {coupon_code}.'
        })

    except Exception as e:
        return JsonResponse({'success': False, 'error': f'Server error: {str(e)}'}, status=500)

@csrf_exempt
def admin_auth_api(request):
    """Authenticate owner passcode."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body) if request.content_type == 'application/json' else request.POST
        pin = data.get('pin', '').strip()

        if pin == ADMIN_PASSCODE:
            request.session['is_admin'] = True
            return JsonResponse({'success': True, 'message': 'Authenticated successfully!'})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid Access PIN'}, status=401)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

def get_leads_api(request):
    """Returns all leads stored in MySQL database for owner dashboard."""
    leads = UserLead.objects.all().order_by('-created_at')
    leads_data = []
    for l in leads:
        leads_data.append({
            'id': l.lead_id,
            'timestamp': l.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'fullName': l.full_name,
            'age': l.age,
            'gender': l.gender,
            'source': l.source,
            'mobile': l.mobile,
            'couponRevealed': l.coupon_code
        })
    return JsonResponse({'success': True, 'leads': leads_data})

def export_leads_csv(request):
    """Exports all MySQL database records to CSV."""
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="myntra_leads_mysql.csv"'
    response.write('\uFEFF') # UTF-8 BOM

    writer = csv.writer(response)
    writer.writerow(['ID', 'Date & Time', 'Full Name', 'Age', 'Gender', 'Heard From', 'Mobile Number', 'Coupon Code'])

    leads = UserLead.objects.all().order_by('-created_at')
    for l in leads:
        writer.writerow([
            l.lead_id,
            l.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            l.full_name,
            l.age,
            l.gender,
            l.source,
            f"+91 {l.mobile}",
            l.coupon_code
        ])

    return response

@csrf_exempt
def clear_leads_api(request):
    """Clears all leads from MySQL database."""
    if request.method == 'POST':
        UserLead.objects.all().delete()
        return JsonResponse({'success': True, 'message': 'Database records cleared.'})
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
