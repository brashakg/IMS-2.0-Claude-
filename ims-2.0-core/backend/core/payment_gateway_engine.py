"""
IMS 2.0 - Payment Gateway Engine
==================================
Razorpay payment processing business logic

Features:
1. Order creation
2. Payment verification (signature validation)
3. Refund processing
4. Webhook handling
5. Multiple payment methods (UPI, Cards, Net Banking, Wallets)
6. Transaction ledger
"""
import hashlib
import hmac
import uuid
from typing import Dict, Tuple, Optional
from datetime import datetime
from decimal import Decimal


class PaymentGatewayEngine:
    """
    Razorpay payment gateway integration engine

    Note: In production, install razorpay SDK:
    pip install razorpay

    For now, implements core logic without actual SDK calls (mock mode)
    """

    def __init__(self, key_id: str, key_secret: str, webhook_secret: str):
        """
        Initialize payment gateway

        Args:
            key_id: Razorpay Key ID
            key_secret: Razorpay Key Secret
            webhook_secret: Razorpay Webhook Secret
        """
        self.key_id = key_id
        self.key_secret = key_secret
        self.webhook_secret = webhook_secret

        # In production, uncomment this:
        # import razorpay
        # self.client = razorpay.Client(auth=(key_id, key_secret))

        self.mock_mode = True  # Set to False in production

    # =========================================================================
    # ORDER CREATION
    # =========================================================================

    def create_order(
        self,
        amount: float,
        currency: str = "INR",
        receipt: str = None,
        notes: Dict = None
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Create Razorpay order

        Args:
            amount: Amount in rupees (will be converted to paise)
            currency: Currency code (default: INR)
            receipt: Receipt/Order ID from your system
            notes: Additional notes/metadata

        Returns:
            Tuple of (success, order_data, error_message)
        """
        try:
            # Convert to paise (Razorpay expects amount in smallest currency unit)
            amount_paise = int(amount * 100)

            if amount_paise <= 0:
                return False, None, "Amount must be greater than 0"

            # Prepare order data
            order_data = {
                "amount": amount_paise,
                "currency": currency,
                "receipt": receipt or f"rcpt_{uuid.uuid4().hex[:12]}",
                "notes": notes or {}
            }

            if self.mock_mode:
                # Mock response for testing
                razorpay_order = {
                    "id": f"order_{uuid.uuid4().hex[:14]}",
                    "entity": "order",
                    "amount": amount_paise,
                    "amount_paid": 0,
                    "amount_due": amount_paise,
                    "currency": currency,
                    "receipt": order_data["receipt"],
                    "status": "created",
                    "attempts": 0,
                    "notes": order_data["notes"],
                    "created_at": int(datetime.now().timestamp())
                }
            else:
                # Production: Use Razorpay SDK
                # razorpay_order = self.client.order.create(data=order_data)
                razorpay_order = {}  # Placeholder

            return True, razorpay_order, None

        except Exception as e:
            return False, None, f"Failed to create order: {str(e)}"

    # =========================================================================
    # PAYMENT VERIFICATION
    # =========================================================================

    def verify_payment_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify Razorpay payment signature

        This is CRITICAL for security - ensures payment actually came from Razorpay

        Args:
            razorpay_order_id: Order ID from Razorpay
            razorpay_payment_id: Payment ID from Razorpay
            razorpay_signature: Signature to verify

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Create signature string
            message = f"{razorpay_order_id}|{razorpay_payment_id}"

            # Generate expected signature
            expected_signature = hmac.new(
                self.key_secret.encode(),
                message.encode(),
                hashlib.sha256
            ).hexdigest()

            # Compare signatures
            is_valid = hmac.compare_digest(
                expected_signature,
                razorpay_signature
            )

            if not is_valid:
                return False, "Invalid payment signature"

            return True, None

        except Exception as e:
            return False, f"Signature verification failed: {str(e)}"

    def verify_webhook_signature(
        self,
        payload: str,
        signature: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Verify webhook signature

        Args:
            payload: Raw webhook payload (JSON string)
            signature: X-Razorpay-Signature header value

        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            expected_signature = hmac.new(
                self.webhook_secret.encode(),
                payload.encode(),
                hashlib.sha256
            ).hexdigest()

            is_valid = hmac.compare_digest(
                expected_signature,
                signature
            )

            if not is_valid:
                return False, "Invalid webhook signature"

            return True, None

        except Exception as e:
            return False, f"Webhook verification failed: {str(e)}"

    # =========================================================================
    # PAYMENT CAPTURE
    # =========================================================================

    def capture_payment(
        self,
        payment_id: str,
        amount: float,
        currency: str = "INR"
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Capture payment (for authorized payments)

        Note: Auto-capture is enabled by default in Razorpay,
        so this is typically not needed unless you're using manual capture

        Args:
            payment_id: Razorpay payment ID
            amount: Amount to capture in rupees
            currency: Currency code

        Returns:
            Tuple of (success, payment_data, error_message)
        """
        try:
            amount_paise = int(amount * 100)

            if self.mock_mode:
                # Mock response
                payment_data = {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": amount_paise,
                    "currency": currency,
                    "status": "captured",
                    "captured": True
                }
            else:
                # Production: Use Razorpay SDK
                # payment_data = self.client.payment.capture(
                #     payment_id,
                #     amount_paise
                # )
                payment_data = {}

            return True, payment_data, None

        except Exception as e:
            return False, None, f"Failed to capture payment: {str(e)}"

    # =========================================================================
    # PAYMENT DETAILS
    # =========================================================================

    def fetch_payment(self, payment_id: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Fetch payment details from Razorpay

        Args:
            payment_id: Razorpay payment ID

        Returns:
            Tuple of (success, payment_data, error_message)
        """
        try:
            if self.mock_mode:
                # Mock response
                payment_data = {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": 100000,  # ₹1000 in paise
                    "currency": "INR",
                    "status": "captured",
                    "method": "card",
                    "captured": True,
                    "email": "customer@example.com",
                    "contact": "+919876543210",
                    "created_at": int(datetime.now().timestamp())
                }
            else:
                # Production: Use Razorpay SDK
                # payment_data = self.client.payment.fetch(payment_id)
                payment_data = {}

            return True, payment_data, None

        except Exception as e:
            return False, None, f"Failed to fetch payment: {str(e)}"

    # =========================================================================
    # REFUND PROCESSING
    # =========================================================================

    def create_refund(
        self,
        payment_id: str,
        amount: Optional[float] = None,
        notes: Dict = None
    ) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Create refund for a payment

        Args:
            payment_id: Razorpay payment ID
            amount: Amount to refund in rupees (None for full refund)
            notes: Additional notes/reason for refund

        Returns:
            Tuple of (success, refund_data, error_message)
        """
        try:
            refund_data = {
                "notes": notes or {}
            }

            if amount is not None:
                refund_data["amount"] = int(amount * 100)  # Convert to paise

            if self.mock_mode:
                # Mock response
                refund = {
                    "id": f"rfnd_{uuid.uuid4().hex[:14]}",
                    "entity": "refund",
                    "amount": refund_data.get("amount", 100000),
                    "currency": "INR",
                    "payment_id": payment_id,
                    "notes": refund_data["notes"],
                    "receipt": None,
                    "status": "processed",
                    "speed_requested": "normal",
                    "speed_processed": "normal",
                    "created_at": int(datetime.now().timestamp())
                }
            else:
                # Production: Use Razorpay SDK
                # refund = self.client.payment.refund(payment_id, refund_data)
                refund = {}

            return True, refund, None

        except Exception as e:
            return False, None, f"Failed to create refund: {str(e)}"

    def fetch_refund(self, refund_id: str) -> Tuple[bool, Optional[Dict], Optional[str]]:
        """
        Fetch refund details

        Args:
            refund_id: Razorpay refund ID

        Returns:
            Tuple of (success, refund_data, error_message)
        """
        try:
            if self.mock_mode:
                # Mock response
                refund_data = {
                    "id": refund_id,
                    "entity": "refund",
                    "amount": 100000,
                    "currency": "INR",
                    "status": "processed",
                    "created_at": int(datetime.now().timestamp())
                }
            else:
                # Production: Use Razorpay SDK
                # refund_data = self.client.refund.fetch(refund_id)
                refund_data = {}

            return True, refund_data, None

        except Exception as e:
            return False, None, f"Failed to fetch refund: {str(e)}"

    # =========================================================================
    # UTILITY METHODS
    # =========================================================================

    def rupees_to_paise(self, amount: float) -> int:
        """Convert rupees to paise"""
        return int(amount * 100)

    def paise_to_rupees(self, amount: int) -> float:
        """Convert paise to rupees"""
        return amount / 100

    def generate_checkout_options(
        self,
        razorpay_order_id: str,
        amount: float,
        customer_name: str = None,
        customer_email: str = None,
        customer_contact: str = None,
        description: str = None
    ) -> Dict:
        """
        Generate options for Razorpay checkout

        This creates the JavaScript object needed for frontend integration

        Args:
            razorpay_order_id: Order ID from Razorpay
            amount: Amount in rupees
            customer_name: Customer name (optional)
            customer_email: Customer email (optional)
            customer_contact: Customer phone (optional)
            description: Order description (optional)

        Returns:
            Dict with checkout options
        """
        options = {
            "key": self.key_id,
            "amount": int(amount * 100),  # paise
            "currency": "INR",
            "name": "Beauty Vision",
            "description": description or "Order Payment",
            "order_id": razorpay_order_id,
            "prefill": {},
            "theme": {
                "color": "#F37254"  # Brand color
            }
        }

        if customer_name:
            options["prefill"]["name"] = customer_name
        if customer_email:
            options["prefill"]["email"] = customer_email
        if customer_contact:
            options["prefill"]["contact"] = customer_contact

        return options


# =============================================================================
# DEMO/TESTING
# =============================================================================

def demo_payment_flow():
    """Demonstrate payment gateway flow"""
    print("=" * 70)
    print("RAZORPAY PAYMENT GATEWAY - DEMO")
    print("=" * 70)

    # Initialize engine
    engine = PaymentGatewayEngine(
        key_id="rzp_test_xxxxx",
        key_secret="test_secret_key",
        webhook_secret="webhook_secret"
    )

    # -------------------------------------------------------------------------
    # SCENARIO 1: Create Order
    # -------------------------------------------------------------------------
    print("\n📝 SCENARIO 1: Create Razorpay Order")
    print("-" * 50)

    success, order, error = engine.create_order(
        amount=1250.00,  # ₹1,250
        receipt="ORDER-001",
        notes={
            "customer_name": "Rajesh Kumar",
            "order_type": "POS"
        }
    )

    if success:
        print(f"✓ Order Created: {order['id']}")
        print(f"  Amount: ₹{engine.paise_to_rupees(order['amount'])}")
        print(f"  Receipt: {order['receipt']}")
        print(f"  Status: {order['status']}")
    else:
        print(f"✗ Error: {error}")

    # -------------------------------------------------------------------------
    # SCENARIO 2: Verify Payment
    # -------------------------------------------------------------------------
    print("\n🔐 SCENARIO 2: Verify Payment Signature")
    print("-" * 50)

    # Mock data (in production, this comes from frontend callback)
    razorpay_order_id = order["id"]
    razorpay_payment_id = "pay_test123456789"

    # Generate test signature
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    test_signature = hmac.new(
        engine.key_secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    is_valid, error = engine.verify_payment_signature(
        razorpay_order_id,
        razorpay_payment_id,
        test_signature
    )

    if is_valid:
        print(f"✓ Payment Verified: {razorpay_payment_id}")
        print(f"  Signature Valid: {test_signature[:20]}...")
    else:
        print(f"✗ Verification Failed: {error}")

    # -------------------------------------------------------------------------
    # SCENARIO 3: Fetch Payment Details
    # -------------------------------------------------------------------------
    print("\n📊 SCENARIO 3: Fetch Payment Details")
    print("-" * 50)

    success, payment, error = engine.fetch_payment(razorpay_payment_id)

    if success:
        print(f"✓ Payment Details:")
        print(f"  ID: {payment['id']}")
        print(f"  Amount: ₹{engine.paise_to_rupees(payment['amount'])}")
        print(f"  Method: {payment['method']}")
        print(f"  Status: {payment['status']}")
    else:
        print(f"✗ Error: {error}")

    # -------------------------------------------------------------------------
    # SCENARIO 4: Create Refund
    # -------------------------------------------------------------------------
    print("\n💸 SCENARIO 4: Create Refund")
    print("-" * 50)

    success, refund, error = engine.create_refund(
        payment_id=razorpay_payment_id,
        amount=500.00,  # Partial refund
        notes={"reason": "Product return"}
    )

    if success:
        print(f"✓ Refund Created: {refund['id']}")
        print(f"  Amount: ₹{engine.paise_to_rupees(refund['amount'])}")
        print(f"  Status: {refund['status']}")
    else:
        print(f"✗ Error: {error}")

    # -------------------------------------------------------------------------
    # SCENARIO 5: Generate Checkout Options
    # -------------------------------------------------------------------------
    print("\n🛒 SCENARIO 5: Generate Checkout Options")
    print("-" * 50)

    checkout_options = engine.generate_checkout_options(
        razorpay_order_id=order["id"],
        amount=1250.00,
        customer_name="Rajesh Kumar",
        customer_email="rajesh@example.com",
        customer_contact="+919876543210",
        description="Frame + Lenses"
    )

    print(f"✓ Checkout Options Generated:")
    print(f"  Key: {checkout_options['key']}")
    print(f"  Order ID: {checkout_options['order_id']}")
    print(f"  Amount: ₹{engine.paise_to_rupees(checkout_options['amount'])}")
    print(f"  Prefill: {checkout_options['prefill']}")

    print("\n" + "=" * 70)
    print("END OF DEMO")
    print("=" * 70)


if __name__ == "__main__":
    demo_payment_flow()
