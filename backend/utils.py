"""
Utility Functions for WiseInvestor Platform
Includes model helpers, data validation, and common functions
"""

from typing import Optional, Any, Type
from sqlalchemy.ext.declarative import DeclarativeMeta
import models


def _safe_model(model_name: str) -> Optional[Type[DeclarativeMeta]]:
    """
    Safely retrieve a SQLAlchemy model by name.
    
    Returns the model class if it exists, None otherwise.
    This is useful for optional analytics tables that may not exist
    in all deployments.
    
    Args:
        model_name: Name of the model class (e.g., "AdMetric", "WebSession")
    
    Returns:
        Model class if found, None otherwise
    
    Example:
        AdMetric = _safe_model("AdMetric")
        if AdMetric:
            # Use the model
            query = db.query(AdMetric)
        else:
            # Handle missing model gracefully
            return {"error": "AdMetric table not configured"}
    """
    return getattr(models, model_name, None)


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Safely divide two numbers, returning default if denominator is zero.
    
    Args:
        numerator: Number to divide
        denominator: Number to divide by
        default: Value to return if denominator is zero (default: 0.0)
    
    Returns:
        Result of division or default value
    
    Example:
        cpc = safe_divide(total_spend, total_clicks)
        rate = safe_divide(conversions, visitors, default=0.0)
    """
    if denominator == 0:
        return default
    return numerator / denominator


def safe_percentage(numerator: float, denominator: float, default: float = 0.0) -> float:
    """
    Calculate percentage safely, returning default if denominator is zero.
    
    Args:
        numerator: Number to calculate percentage of
        denominator: Total number
        default: Value to return if denominator is zero (default: 0.0)
    
    Returns:
        Percentage (0-100) or default value
    
    Example:
        retention_rate = safe_percentage(retained, total_donors)
        bounce_rate = safe_percentage(bounces, total_sessions)
    """
    if denominator == 0:
        return default
    return round((numerator / denominator) * 100, 2)


def format_currency(amount: float, currency: str = "USD") -> str:
    """
    Format a number as currency.
    
    Args:
        amount: Amount to format
        currency: Currency code (default: "USD")
    
    Returns:
        Formatted currency string
    
    Example:
        formatted = format_currency(1234.56)  # "$1,234.56"
    """
    if currency == "USD":
        return f"${amount:,.2f}"
    return f"{amount:,.2f} {currency}"


def validate_date_range(start_date: Any, end_date: Any) -> tuple:
    """
    Validate and normalize date range.
    
    Args:
        start_date: Start date (datetime or string)
        end_date: End date (datetime or string)
    
    Returns:
        Tuple of (start_date, end_date) as datetime objects
    
    Raises:
        ValueError: If dates are invalid or end is before start
    
    Example:
        start, end = validate_date_range("2024-01-01", "2024-12-31")
    """
    from datetime import datetime
    
    # Convert strings to datetime if needed
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    if end_date < start_date:
        raise ValueError("End date must be after start date")
    
    return start_date, end_date


def get_quarter_dates(year: int, quarter: int) -> tuple:
    """
    Get start and end dates for a fiscal quarter.
    
    Args:
        year: Year (e.g., 2024)
        quarter: Quarter number (1-4)
    
    Returns:
        Tuple of (start_date, end_date) as datetime objects
    
    Example:
        start, end = get_quarter_dates(2024, 2)  # Q2 2024
    """
    from datetime import datetime, timedelta
    
    if quarter < 1 or quarter > 4:
        raise ValueError("Quarter must be between 1 and 4")
    
    start_month = (quarter - 1) * 3 + 1
    start_date = datetime(year, start_month, 1)
    
    if quarter == 4:
        end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
    else:
        end_date = datetime(year, start_month + 3, 1) - timedelta(seconds=1)
    
    return start_date, end_date


def get_fiscal_year_dates(year: int, fiscal_start_month: int = 1) -> tuple:
    """
    Get start and end dates for a fiscal year.
    
    Args:
        year: Calendar year
        fiscal_start_month: Month that fiscal year starts (1-12, default: 1)
    
    Returns:
        Tuple of (start_date, end_date) as datetime objects
    
    Example:
        # For July 1 fiscal year start:
        start, end = get_fiscal_year_dates(2024, fiscal_start_month=7)
    """
    from datetime import datetime, timedelta
    
    start_date = datetime(year, fiscal_start_month, 1)
    
    if fiscal_start_month == 1:
        end_date = datetime(year, 12, 31, 23, 59, 59)
    else:
        end_date = datetime(year + 1, fiscal_start_month, 1) - timedelta(seconds=1)
    
    return start_date, end_date


def calculate_growth_rate(current: float, previous: float) -> float:
    """
    Calculate growth rate as a percentage.
    
    Args:
        current: Current period value
        previous: Previous period value
    
    Returns:
        Growth rate as percentage (positive or negative)
    
    Example:
        growth = calculate_growth_rate(150000, 120000)  # 25.0
    """
    if previous == 0:
        return 0.0 if current == 0 else 100.0
    
    return round(((current - previous) / previous) * 100, 2)


def chunk_list(lst: list, chunk_size: int) -> list:
    """
    Split a list into chunks of specified size.
    
    Args:
        lst: List to chunk
        chunk_size: Size of each chunk
    
    Returns:
        List of chunks
    
    Example:
        chunks = chunk_list(donor_ids, 100)  # Process 100 at a time
    """
    return [lst[i:i + chunk_size] for i in range(0, len(lst), chunk_size)]


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename for safe storage.
    
    Args:
        filename: Original filename
    
    Returns:
        Sanitized filename
    
    Example:
        safe_name = sanitize_filename("My Report!.pdf")  # "my-report.pdf"
    """
    import re
    
    # Remove special characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Replace spaces with hyphens
    filename = re.sub(r'\s+', '-', filename)
    # Convert to lowercase
    filename = filename.lower()
    
    return filename


def generate_report_filename(org_name: str, report_type: str, extension: str = "pdf") -> str:
    """
    Generate a standardized report filename.
    
    Args:
        org_name: Organization name
        report_type: Type of report (e.g., "executive", "donor-lifecycle")
        extension: File extension (default: "pdf")
    
    Returns:
        Formatted filename
    
    Example:
        filename = generate_report_filename("Hope Foundation", "executive")
        # "hope-foundation-executive-2024-10-25.pdf"
    """
    from datetime import datetime
    
    org_slug = sanitize_filename(org_name)
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    return f"{org_slug}-{report_type}-{date_str}.{extension}"


def get_rag_status(current: float, target: float, tolerance: float = 0.1) -> str:
    """
    Get RAG (Red/Amber/Green) status based on current vs target.
    
    Args:
        current: Current value
        target: Target value
        tolerance: Tolerance percentage (default: 0.1 = 10%)
    
    Returns:
        "Green", "Amber", or "Red"
    
    Example:
        status = get_rag_status(85, 75)  # "Green" (exceeded target)
        status = get_rag_status(70, 75)  # "Amber" (within 10% of target)
        status = get_rag_status(50, 75)  # "Red" (more than 10% below)
    """
    if target == 0:
        return "Amber"
    
    variance = (current - target) / target
    
    if variance >= 0:
        return "Green"
    elif abs(variance) <= tolerance:
        return "Amber"
    else:
        return "Red"


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to maximum length with optional suffix.
    
    Args:
        text: Text to truncate
        max_length: Maximum length (default: 100)
        suffix: Suffix to add when truncated (default: "...")
    
    Returns:
        Truncated text
    
    Example:
        short = truncate_text(long_description, 50)
    """
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def parse_donor_tier(total_donated: float) -> str:
    """
    Determine donor tier based on total donation amount.
    
    Args:
        total_donated: Total amount donated
    
    Returns:
        Tier name (e.g., "Major", "Mid-Level", "Regular", "New")
    
    Example:
        tier = parse_donor_tier(15000)  # "Major"
    """
    if total_donated >= 25000:
        return "Transformational"
    elif total_donated >= 10000:
        return "Major"
    elif total_donated >= 1000:
        return "Mid-Level"
    elif total_donated >= 100:
        return "Regular"
    else:
        return "New"


def calculate_retention_rate(retained_count: int, total_count: int) -> float:
    """
    Calculate retention rate as a percentage.
    
    Args:
        retained_count: Number of donors/customers retained
        total_count: Total number from previous period
    
    Returns:
        Retention rate percentage
    
    Example:
        rate = calculate_retention_rate(450, 500)  # 90.0
    """
    return safe_percentage(retained_count, total_count)


def get_cohort_label(start_date) -> str:
    """
    Generate a cohort label from a start date.
    
    Args:
        start_date: Start date for the cohort
    
    Returns:
        Cohort label (e.g., "2024-Q1", "2024-Jan")
    
    Example:
        label = get_cohort_label(datetime(2024, 1, 15))  # "2024-Q1"
    """
    from datetime import datetime
    
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    
    quarter = (start_date.month - 1) // 3 + 1
    return f"{start_date.year}-Q{quarter}"


def aggregate_by_period(data: list, period: str = "month") -> dict:
    """
    Aggregate data by time period.
    
    Args:
        data: List of items with date fields
        period: Period to aggregate by ("day", "week", "month", "quarter", "year")
    
    Returns:
        Dictionary with period labels as keys
    
    Example:
        monthly = aggregate_by_period(donations, period="month")
    """
    from collections import defaultdict
    from datetime import datetime
    
    aggregated = defaultdict(list)
    
    for item in data:
        date_val = item.get('date') or item.get('created_at')
        
        if isinstance(date_val, str):
            date_val = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
        
        if period == "day":
            key = date_val.strftime("%Y-%m-%d")
        elif period == "week":
            key = date_val.strftime("%Y-W%U")
        elif period == "month":
            key = date_val.strftime("%Y-%m")
        elif period == "quarter":
            quarter = (date_val.month - 1) // 3 + 1
            key = f"{date_val.year}-Q{quarter}"
        elif period == "year":
            key = str(date_val.year)
        else:
            key = date_val.strftime("%Y-%m-%d")
        
        aggregated[key].append(item)
    
    return dict(aggregated)


# Export commonly used functions
__all__ = [
    '_safe_model',
    'safe_divide',
    'safe_percentage',
    'format_currency',
    'validate_date_range',
    'get_quarter_dates',
    'get_fiscal_year_dates',
    'calculate_growth_rate',
    'chunk_list',
    'sanitize_filename',
    'generate_report_filename',
    'get_rag_status',
    'truncate_text',
    'parse_donor_tier',
    'calculate_retention_rate',
    'get_cohort_label',
    'aggregate_by_period',
]
