"""
IMS 2.0 - AI Intelligence API Router
=====================================
Exposes AIIntelligenceEngine functionality via REST API

CRITICAL: READ-ONLY, SUPERADMIN-ONLY, ADVISORY MODE
- NO auto-execution of changes
- All recommendations require human approval
- Full audit trail of AI interactions
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal
from .auth import get_current_user
from ...core.ai_intelligence_engine import (
    AIIntelligenceEngine,
    InsightCategory,
    InsightSeverity,
    InsightStatus,
    RecommendationType
)

router = APIRouter()

# Initialize engine (would be injected via DI in production)
ai_engine = AIIntelligenceEngine()


# ============================================================================
# Request/Response Models
# ============================================================================

class GenerateInsightRequest(BaseModel):
    category: str  # SALES, INVENTORY, DISCOUNT, CLINICAL, HR, FINANCE, CUSTOMER, COMPLIANCE
    severity: str  # INFO, WARNING, CRITICAL
    title: str
    description: str
    data_points: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None

class CreateRecommendationRequest(BaseModel):
    recommendation_type: str  # STOCK_REORDER, PRICE_ADJUSTMENT, STAFF_TRAINING, etc.
    title: str
    description: str
    rationale: str
    expected_impact: str
    implementation_steps: List[str]

class ApproveRecommendationRequest(BaseModel):
    recommendation_id: str

class AskIntelligenceRequest(BaseModel):
    query: str
    context_data: Optional[Dict[str, Any]] = None

class PurchaseAdviceRequest(BaseModel):
    product_description: str
    estimated_price: float
    category: str

class DetectPatternsRequest(BaseModel):
    pattern_type: str  # discount, clinical, inventory
    data: List[Dict[str, Any]]


def verify_superadmin(current_user: dict):
    """Verify superadmin access for AI endpoints"""
    if current_user.get("role") != "SUPERADMIN":
        raise HTTPException(
            status_code=403,
            detail="AI Intelligence is SUPERADMIN-only"
        )


# ============================================================================
# Dashboard Endpoint
# ============================================================================

@router.get("/dashboard")
async def get_ai_dashboard(current_user: dict = Depends(get_current_user)):
    """Get AI Intelligence dashboard data"""
    verify_superadmin(current_user)

    success, message, dashboard = ai_engine.get_superadmin_ai_dashboard(
        current_user.get("role")
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "data": dashboard}


# ============================================================================
# Insights Endpoints
# ============================================================================

@router.get("/insights")
async def list_insights(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """List all AI insights with optional filtering"""
    verify_superadmin(current_user)

    insights = list(ai_engine.insights.values())

    # Apply filters
    if category:
        try:
            cat = InsightCategory(category.upper())
            insights = [i for i in insights if i.category == cat]
        except ValueError:
            pass

    if severity:
        try:
            sev = InsightSeverity(severity.upper())
            insights = [i for i in insights if i.severity == sev]
        except ValueError:
            pass

    if status:
        try:
            stat = InsightStatus(status.upper())
            insights = [i for i in insights if i.status == stat]
        except ValueError:
            pass

    # Sort by created_at descending and limit
    insights = sorted(insights, key=lambda x: x.created_at, reverse=True)[:limit]

    return {
        "success": True,
        "insights": [
            {
                "id": i.id,
                "category": i.category.value,
                "severity": i.severity.value,
                "title": i.title,
                "description": i.description,
                "data_points": i.data_points,
                "recommendation": i.recommendation,
                "status": i.status.value,
                "created_at": i.created_at.isoformat(),
                "affected_stores": i.affected_stores,
                "affected_employees": i.affected_employees
            }
            for i in insights
        ],
        "total": len(ai_engine.insights)
    }


@router.get("/insights/{insight_id}")
async def get_insight(insight_id: str, current_user: dict = Depends(get_current_user)):
    """Get specific insight details"""
    verify_superadmin(current_user)

    insight = ai_engine.insights.get(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    # Mark as viewed
    if insight.status == InsightStatus.NEW:
        insight.status = InsightStatus.VIEWED
        insight.viewed_at = insight.viewed_at or __import__("datetime").datetime.now()

    return {
        "success": True,
        "insight": {
            "id": insight.id,
            "category": insight.category.value,
            "severity": insight.severity.value,
            "title": insight.title,
            "description": insight.description,
            "data_points": insight.data_points,
            "recommendation": insight.recommendation,
            "status": insight.status.value,
            "created_at": insight.created_at.isoformat(),
            "viewed_at": insight.viewed_at.isoformat() if insight.viewed_at else None
        }
    }


@router.post("/insights/generate")
async def generate_insight(
    request: GenerateInsightRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate a new AI insight"""
    verify_superadmin(current_user)

    try:
        category = InsightCategory(request.category.upper())
        severity = InsightSeverity(request.severity.upper())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid category or severity: {e}")

    insight = ai_engine.generate_insight(
        category,
        severity,
        request.title,
        request.description,
        request.data_points,
        request.recommendation
    )

    return {
        "success": True,
        "insight_id": insight.id,
        "message": "Insight generated successfully"
    }


@router.post("/insights/generate-daily")
async def generate_daily_insights(
    data: Dict[str, Any],
    current_user: dict = Depends(get_current_user)
):
    """Generate automated daily business insights"""
    verify_superadmin(current_user)

    insights = ai_engine.generate_daily_insights(data)

    return {
        "success": True,
        "insights_generated": len(insights),
        "insight_ids": [i.id for i in insights]
    }


@router.post("/insights/{insight_id}/dismiss")
async def dismiss_insight(insight_id: str, current_user: dict = Depends(get_current_user)):
    """Dismiss an insight"""
    verify_superadmin(current_user)

    insight = ai_engine.insights.get(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.status = InsightStatus.DISMISSED

    return {"success": True, "message": "Insight dismissed"}


@router.post("/insights/{insight_id}/action")
async def mark_insight_actioned(insight_id: str, current_user: dict = Depends(get_current_user)):
    """Mark insight as actioned"""
    verify_superadmin(current_user)

    insight = ai_engine.insights.get(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    insight.status = InsightStatus.ACTIONED
    insight.actioned_at = __import__("datetime").datetime.now()
    insight.actioned_by = current_user.get("user_id")

    return {"success": True, "message": "Insight marked as actioned"}


# ============================================================================
# Recommendations Endpoints
# ============================================================================

@router.get("/recommendations")
async def list_recommendations(
    status: Optional[str] = None,
    rec_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """List all AI recommendations"""
    verify_superadmin(current_user)

    recommendations = list(ai_engine.recommendations.values())

    # Apply filters
    if status:
        recommendations = [r for r in recommendations if r.status == status.upper()]

    if rec_type:
        try:
            rt = RecommendationType(rec_type.upper())
            recommendations = [r for r in recommendations if r.recommendation_type == rt]
        except ValueError:
            pass

    # Sort and limit
    recommendations = sorted(recommendations, key=lambda x: x.created_at, reverse=True)[:limit]

    return {
        "success": True,
        "recommendations": [
            {
                "id": r.id,
                "type": r.recommendation_type.value,
                "title": r.title,
                "description": r.description,
                "rationale": r.rationale,
                "expected_impact": r.expected_impact,
                "implementation_steps": r.implementation_steps,
                "status": r.status,
                "requires_approval": r.requires_approval,
                "created_at": r.created_at.isoformat(),
                "approved_by": r.approved_by,
                "approved_at": r.approved_at.isoformat() if r.approved_at else None
            }
            for r in recommendations
        ],
        "total": len(ai_engine.recommendations)
    }


@router.post("/recommendations/create")
async def create_recommendation(
    request: CreateRecommendationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new AI recommendation (requires approval)"""
    verify_superadmin(current_user)

    try:
        rec_type = RecommendationType(request.recommendation_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid recommendation type: {request.recommendation_type}")

    rec = ai_engine.create_recommendation(
        rec_type,
        request.title,
        request.description,
        request.rationale,
        request.expected_impact,
        request.implementation_steps
    )

    return {
        "success": True,
        "recommendation_id": rec.id,
        "message": "Recommendation created. Requires approval for implementation."
    }


@router.post("/recommendations/{recommendation_id}/approve")
async def approve_recommendation(
    recommendation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Approve a recommendation - SUPERADMIN ONLY"""
    verify_superadmin(current_user)

    success, message = ai_engine.approve_recommendation(
        recommendation_id,
        current_user.get("user_id"),
        current_user.get("role")
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message}


@router.post("/recommendations/{recommendation_id}/reject")
async def reject_recommendation(
    recommendation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Reject a recommendation"""
    verify_superadmin(current_user)

    rec = ai_engine.recommendations.get(recommendation_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "REJECTED"

    return {"success": True, "message": "Recommendation rejected"}


# ============================================================================
# Pattern Detection Endpoints
# ============================================================================

@router.get("/patterns")
async def list_patterns(
    acknowledged: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all detected patterns"""
    verify_superadmin(current_user)

    patterns = list(ai_engine.patterns.values())

    if acknowledged is not None:
        patterns = [p for p in patterns if p.is_acknowledged == acknowledged]

    return {
        "success": True,
        "patterns": [
            {
                "id": p.id,
                "pattern_type": p.pattern_type,
                "description": p.description,
                "occurrences": p.occurrences,
                "first_detected": p.first_detected.isoformat(),
                "last_detected": p.last_detected.isoformat(),
                "entities_involved": p.entities_involved,
                "severity": p.severity.value,
                "is_acknowledged": p.is_acknowledged
            }
            for p in patterns
        ],
        "total": len(patterns)
    }


@router.post("/patterns/detect")
async def detect_patterns(
    request: DetectPatternsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Run pattern detection on provided data"""
    verify_superadmin(current_user)

    patterns = []

    if request.pattern_type == "discount":
        patterns = ai_engine.detect_discount_abuse_patterns(request.data)
    elif request.pattern_type == "clinical":
        patterns = ai_engine.detect_clinical_patterns(request.data)
    elif request.pattern_type == "inventory":
        patterns = ai_engine.detect_inventory_patterns(request.data)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown pattern type: {request.pattern_type}")

    return {
        "success": True,
        "patterns_detected": len(patterns),
        "patterns": [
            {
                "id": p.id,
                "pattern_type": p.pattern_type,
                "description": p.description,
                "occurrences": p.occurrences,
                "severity": p.severity.value
            }
            for p in patterns
        ]
    }


@router.post("/patterns/{pattern_id}/acknowledge")
async def acknowledge_pattern(pattern_id: str, current_user: dict = Depends(get_current_user)):
    """Acknowledge a detected pattern"""
    verify_superadmin(current_user)

    pattern = ai_engine.patterns.get(pattern_id)
    if not pattern:
        raise HTTPException(status_code=404, detail="Pattern not found")

    pattern.is_acknowledged = True

    return {"success": True, "message": "Pattern acknowledged"}


# ============================================================================
# Ask Intelligence (Natural Language Query)
# ============================================================================

@router.post("/ask")
async def ask_intelligence(
    request: AskIntelligenceRequest,
    current_user: dict = Depends(get_current_user)
):
    """Natural language query to AI Intelligence"""
    verify_superadmin(current_user)

    success, response, query_record = ai_engine.ask_intelligence(
        request.query,
        current_user.get("user_id"),
        current_user.get("role"),
        request.context_data
    )

    if not success:
        raise HTTPException(status_code=400, detail=response)

    return {
        "success": True,
        "query_id": query_record.id if query_record else None,
        "response": response,
        "processing_time_ms": query_record.processing_time_ms if query_record else 0
    }


@router.get("/queries")
async def list_queries(limit: int = 50, current_user: dict = Depends(get_current_user)):
    """List recent AI queries"""
    verify_superadmin(current_user)

    queries = sorted(
        ai_engine.queries.values(),
        key=lambda x: x.timestamp,
        reverse=True
    )[:limit]

    return {
        "success": True,
        "queries": [
            {
                "id": q.id,
                "query": q.query,
                "response": q.response[:200] + "..." if q.response and len(q.response) > 200 else q.response,
                "timestamp": q.timestamp.isoformat(),
                "processing_time_ms": q.processing_time_ms
            }
            for q in queries
        ],
        "total": len(ai_engine.queries)
    }


# ============================================================================
# Purchase Advisor (Trade Fair Helper)
# ============================================================================

@router.post("/purchase-advice")
async def get_purchase_advice(
    request: PurchaseAdviceRequest,
    current_user: dict = Depends(get_current_user)
):
    """Get AI purchase advice for trade fair/exhibition"""
    verify_superadmin(current_user)

    success, message, result = ai_engine.get_purchase_advice(
        request.product_description,
        Decimal(str(request.estimated_price)),
        request.category,
        current_user.get("role")
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "advice": {
            "recommendation": result.recommendation,
            "confidence": result.confidence,
            "reasons": result.reasons,
            "suggested_stores": result.suggested_stores,
            "suggested_quantity": result.suggested_quantity,
            "similar_products_in_stock": result.similar_products_in_stock,
            "historical_performance": result.historical_performance
        }
    }


# ============================================================================
# Marketing Intelligence
# ============================================================================

@router.get("/marketing-insights")
async def get_marketing_insights(current_user: dict = Depends(get_current_user)):
    """Get marketing channel performance insights"""
    verify_superadmin(current_user)

    success, message, insights = ai_engine.get_marketing_insights(current_user.get("role"))

    if not success:
        raise HTTPException(status_code=400, detail=message)

    # Convert Decimal to float for JSON serialization
    serializable_insights = {}
    for key, value in insights.items():
        if isinstance(value, dict):
            serializable_insights[key] = {
                k: float(v) if isinstance(v, Decimal) else v
                for k, v in value.items()
            }
        else:
            serializable_insights[key] = value

    return {
        "success": True,
        "message": message,
        "insights": serializable_insights
    }


# ============================================================================
# Sales Forecast & Predictions
# ============================================================================

@router.get("/forecasts/sales")
async def get_sales_forecast(
    store_id: Optional[str] = None,
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get sales forecast predictions"""
    verify_superadmin(current_user)

    # Simulated forecast data (would use ML model in production)
    from datetime import datetime, timedelta

    forecasts = []
    base_amount = 150000
    for i in range(days):
        date = datetime.now() + timedelta(days=i)
        # Add some variance
        variance = (i % 7) * 5000 + (15000 if date.weekday() in [5, 6] else 0)
        forecasts.append({
            "date": date.strftime("%Y-%m-%d"),
            "predicted_amount": base_amount + variance,
            "confidence": 0.85 - (i * 0.01),  # Confidence decreases over time
            "lower_bound": base_amount + variance - 20000,
            "upper_bound": base_amount + variance + 20000
        })

    return {
        "success": True,
        "store_id": store_id or "ALL",
        "forecast_days": days,
        "forecasts": forecasts,
        "summary": {
            "total_predicted": sum(f["predicted_amount"] for f in forecasts),
            "avg_daily": sum(f["predicted_amount"] for f in forecasts) / days,
            "model_accuracy": 0.87
        }
    }


@router.get("/forecasts/inventory")
async def get_inventory_recommendations(
    store_id: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get inventory reorder recommendations"""
    verify_superadmin(current_user)

    # Simulated recommendations
    recommendations = [
        {
            "product_id": "prod-001",
            "product_name": "Ray-Ban RB5154 Clubmaster",
            "category": "FRAME",
            "current_stock": 3,
            "predicted_demand": 8,
            "reorder_quantity": 10,
            "urgency": "HIGH",
            "reason": "Fast-moving item, 2-week lead time"
        },
        {
            "product_id": "prod-002",
            "product_name": "Acuvue Oasys 6-pack",
            "category": "CONTACT_LENS",
            "current_stock": 12,
            "predicted_demand": 25,
            "reorder_quantity": 20,
            "urgency": "MEDIUM",
            "reason": "Monthly bestseller, adequate buffer"
        },
        {
            "product_id": "prod-003",
            "product_name": "Essilor Crizal Sapphire",
            "category": "OPTICAL_LENS",
            "current_stock": 5,
            "predicted_demand": 15,
            "reorder_quantity": 15,
            "urgency": "HIGH",
            "reason": "Premium lens, long lead time"
        }
    ]

    if category:
        recommendations = [r for r in recommendations if r["category"] == category.upper()]

    return {
        "success": True,
        "store_id": store_id or "ALL",
        "recommendations": recommendations,
        "total_items": len(recommendations),
        "high_urgency_count": len([r for r in recommendations if r["urgency"] == "HIGH"])
    }


@router.get("/segments/customers")
async def get_customer_segments(current_user: dict = Depends(get_current_user)):
    """Get AI-generated customer segments"""
    verify_superadmin(current_user)

    segments = [
        {
            "segment_id": "seg-001",
            "name": "Premium Buyers",
            "description": "Customers who consistently buy luxury frames and premium lenses",
            "customer_count": 234,
            "avg_order_value": 15500,
            "recommended_actions": [
                "Invite to exclusive previews",
                "Offer loyalty rewards",
                "Personal stylist service"
            ],
            "churn_risk": "LOW"
        },
        {
            "segment_id": "seg-002",
            "name": "Contact Lens Subscribers",
            "description": "Regular contact lens buyers with predictable purchase cycles",
            "customer_count": 567,
            "avg_order_value": 4200,
            "recommended_actions": [
                "Set up auto-replenishment",
                "Cross-sell solutions and accessories",
                "Birthday month discounts"
            ],
            "churn_risk": "MEDIUM"
        },
        {
            "segment_id": "seg-003",
            "name": "Budget Conscious",
            "description": "Price-sensitive customers looking for value",
            "customer_count": 892,
            "avg_order_value": 3500,
            "recommended_actions": [
                "Highlight offers and deals",
                "EMI options promotion",
                "Insurance claim assistance"
            ],
            "churn_risk": "MEDIUM"
        },
        {
            "segment_id": "seg-004",
            "name": "At-Risk Customers",
            "description": "Previously active customers with declining engagement",
            "customer_count": 156,
            "avg_order_value": 5800,
            "recommended_actions": [
                "Win-back campaign",
                "Prescription reminder",
                "Exclusive return offer"
            ],
            "churn_risk": "HIGH"
        }
    ]

    return {
        "success": True,
        "segments": segments,
        "total_customers_analyzed": sum(s["customer_count"] for s in segments),
        "last_updated": __import__("datetime").datetime.now().isoformat()
    }


@router.get("/insights/staff-performance")
async def get_staff_performance_insights(
    store_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get AI insights on staff performance"""
    verify_superadmin(current_user)

    insights = {
        "top_performers": [
            {
                "staff_id": "emp-001",
                "name": "Rahul Sharma",
                "role": "SALES_STAFF",
                "store": "Bokaro",
                "metrics": {
                    "sales_this_month": 485000,
                    "conversion_rate": 78,
                    "avg_basket_size": 8500,
                    "customer_satisfaction": 4.8
                },
                "strengths": ["Premium frame sales", "Lens upgrades"]
            },
            {
                "staff_id": "emp-002",
                "name": "Priya Singh",
                "role": "OPTOMETRIST",
                "store": "Ranchi",
                "metrics": {
                    "tests_this_month": 145,
                    "conversion_rate": 82,
                    "avg_test_time": 18,
                    "patient_satisfaction": 4.9
                },
                "strengths": ["Thorough examinations", "Patient communication"]
            }
        ],
        "improvement_areas": [
            {
                "staff_id": "emp-003",
                "name": "Amit Kumar",
                "role": "SALES_STAFF",
                "store": "Dhanbad",
                "metrics": {
                    "sales_this_month": 185000,
                    "conversion_rate": 45,
                    "avg_basket_size": 4200
                },
                "areas": ["Lens upgrades training needed", "Follow-up rate low"],
                "recommended_training": ["Premium lens benefits", "Customer follow-up SOP"]
            }
        ],
        "overall_metrics": {
            "avg_conversion_rate": 65,
            "avg_basket_size": 6500,
            "training_completion_rate": 78
        }
    }

    return {
        "success": True,
        "store_id": store_id or "ALL",
        "insights": insights,
        "note": "Advisory only - requires manager review before any action"
    }
