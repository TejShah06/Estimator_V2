from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime


# ── Color Palette ─────────────────────────────────────────────────────────────
CYAN        = colors.HexColor("#06b6d4")
DARK_BLUE   = colors.HexColor("#0f172a")
SLATE       = colors.HexColor("#1e293b")
SLATE_LIGHT = colors.HexColor("#334155")
WHITE       = colors.white
GRAY        = colors.HexColor("#94a3b8")
GREEN       = colors.HexColor("#10b981")
PURPLE      = colors.HexColor("#8b5cf6")
AMBER       = colors.HexColor("#f59e0b")
RED         = colors.HexColor("#ef4444")


def _build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        fontSize=24,
        textColor=WHITE,
        alignment=TA_CENTER,
        fontName="Helvetica-Bold",
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="ReportSubtitle",
        fontSize=12,
        textColor=GRAY,
        alignment=TA_CENTER,
        fontName="Helvetica",
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="SectionTitle",
        fontSize=14,
        textColor=CYAN,
        fontName="Helvetica-Bold",
        spaceBefore=16,
        spaceAfter=8,
    ))
    styles.add(ParagraphStyle(
        name="BodyWhite",
        fontSize=10,
        textColor=WHITE,
        fontName="Helvetica",
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="BodyGray",
        fontSize=9,
        textColor=GRAY,
        fontName="Helvetica",
        spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="TotalCost",
        fontSize=20,
        textColor=GREEN,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="SmallCenter",
        fontSize=8,
        textColor=GRAY,
        alignment=TA_CENTER,
        fontName="Helvetica",
    ))

    return styles


def _format_cost(amount):
    """Format number as Indian currency"""
    if not amount:
        return "₹0"
    num = float(amount)
    if num >= 10_000_000:
        return f"Rs {num / 10_000_000:.2f} Cr"
    if num >= 100_000:
        return f"Rs {num / 100_000:.1f} L"
    if num >= 1_000:
        return f"Rs {num / 1_000:.1f} K"
    return f"Rs {num:,.0f}"


def _dark_table_style(header_bg=None):
    """Common dark theme table style"""
    return TableStyle([
        # Header
        ("BACKGROUND",  (0, 0), (-1, 0),  header_bg or SLATE),
        ("TEXTCOLOR",   (0, 0), (-1, 0),  CYAN),
        ("FONTNAME",    (0, 0), (-1, 0),  "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, 0),  10),
        ("ALIGN",       (0, 0), (-1, 0),  "CENTER"),
        ("TOPPADDING",  (0, 0), (-1, 0),  10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 10),

        # Body rows
        ("BACKGROUND",  (0, 1), (-1, -1), DARK_BLUE),
        ("TEXTCOLOR",   (0, 1), (-1, -1), WHITE),
        ("FONTNAME",    (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE",    (0, 1), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [DARK_BLUE, SLATE]),
        ("ALIGN",       (0, 1), (-1, -1), "CENTER"),
        ("TOPPADDING",  (0, 1), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 8),

        # Grid
        ("GRID",        (0, 0), (-1, -1), 0.5, SLATE_LIGHT),
        ("ROUNDEDCORNERS", [4]),
    ])


# ══════════════════════════════════════════════════════════════════════════════
# 1. AI ANALYSIS REPORT PDF
# ══════════════════════════════════════════════════════════════════════════════
def generate_ai_report_pdf(report: dict) -> BytesIO:
    """
    Generate PDF for AI floor plan analysis report.
    report dict keys: project_name, created_at, total_area_sqft,
    total_area_m2, rooms_count, doors_count, windows_count,
    total_cost, cost_breakdown, rooms, scale_method,
    analysis_time, scale_px_per_foot
    """
    buffer = BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles  = _build_styles()
    story   = []
    W       = A4[0] - 3 * cm   # usable width

    # ── Header Banner ─────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("AI FLOOR PLAN ANALYSIS REPORT", styles["ReportTitle"]),
    ]]
    header_table = Table(header_data, colWidths=[W])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), DARK_BLUE),
        ("TOPPADDING",    (0, 0), (-1, -1), 20),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
        ("ROUNDEDCORNERS", [8]),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 6))

    # ── Project Meta ──────────────────────────────────────────────────────────
    project_name = report.get("project_name", "N/A")
    created_at   = report.get("created_at", "")
    try:
        created_at = datetime.fromisoformat(
            created_at.replace("Z", "+00:00")
        ).strftime("%d %b %Y, %I:%M %p")
    except Exception:
        pass

    meta_data = [
        [
            Paragraph("Project Name", styles["BodyGray"]),
            Paragraph(project_name,   styles["BodyWhite"]),
            Paragraph("Generated On", styles["BodyGray"]),
            Paragraph(created_at,     styles["BodyWhite"]),
        ],
        [
            Paragraph("Scale Method",    styles["BodyGray"]),
            Paragraph(
                str(report.get("scale_method", "auto")).title(),
                styles["BodyWhite"]
            ),
            Paragraph("Processing Time", styles["BodyGray"]),
            Paragraph(
                f"{report.get('analysis_time', 0):.1f}s",
                styles["BodyWhite"]
            ),
        ],
    ]
    meta_table = Table(
        meta_data,
        colWidths=[W * 0.18, W * 0.32, W * 0.18, W * 0.32]
    )
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("GRID",          (0, 0), (-1, -1), 0.3, SLATE_LIGHT),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # ── Stats Cards ───────────────────────────────────────────────────────────
    story.append(
        Paragraph("Project Overview", styles["SectionTitle"])
    )

    stats_data = [[
        Paragraph(
            f"<b>{report.get('total_area_sqft', 0):,.0f}</b><br/>"
            f"<font color='#94a3b8' size=8>sqft Total Area</font>",
            styles["BodyWhite"]
        ),
        Paragraph(
            f"<b>{report.get('rooms_count', 0)}</b><br/>"
            f"<font color='#94a3b8' size=8>Rooms Detected</font>",
            styles["BodyWhite"]
        ),
        Paragraph(
            f"<b>{report.get('doors_count', 0)}</b><br/>"
            f"<font color='#94a3b8' size=8>Doors Found</font>",
            styles["BodyWhite"]
        ),
        Paragraph(
            f"<b>{report.get('windows_count', 0)}</b><br/>"
            f"<font color='#94a3b8' size=8>Windows Found</font>",
            styles["BodyWhite"]
        ),
        Paragraph(
            f"<b>{report.get('total_area_m2', 0):.1f}</b><br/>"
            f"<font color='#94a3b8' size=8>m² Total Area</font>",
            styles["BodyWhite"]
        ),
    ]]
    stats_table = Table(
        stats_data,
        colWidths=[W / 5] * 5
    )
    stats_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_BLUE),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("GRID",          (0, 0), (-1, -1), 0.5, SLATE_LIGHT),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 12))

    # ── Cost Breakdown ────────────────────────────────────────────────────────
    story.append(
        Paragraph("Cost Breakdown", styles["SectionTitle"])
    )

    breakdown   = report.get("cost_breakdown", {})
    total_cost  = report.get("total_cost", 0)
    cost_labels = {
        "flooring":   "Flooring",
        "painting":   "Painting",
        "ceiling":    "Ceiling",
        "electrical": "Electrical",
        "plumbing":   "Plumbing",
        "doors":      "Doors & Windows",
    }

    cost_rows = [[
        Paragraph("Category",   styles["BodyWhite"]),
        Paragraph("Amount",     styles["BodyWhite"]),
        Paragraph("% of Total", styles["BodyWhite"]),
    ]]

    for key, label in cost_labels.items():
        amount = breakdown.get(key, 0)
        pct    = (amount / total_cost * 100) if total_cost > 0 else 0
        cost_rows.append([
            Paragraph(label,              styles["BodyWhite"]),
            Paragraph(_format_cost(amount), styles["BodyWhite"]),
            Paragraph(f"{pct:.1f}%",      styles["BodyGray"]),
        ])

    # Total row
    cost_rows.append([
        Paragraph("<b>TOTAL</b>",              styles["BodyWhite"]),
        Paragraph(
            f"<b>{_format_cost(total_cost)}</b>",
            styles["BodyWhite"]
        ),
        Paragraph("<b>100%</b>",               styles["BodyWhite"]),
    ])

    cost_table = Table(
        cost_rows,
        colWidths=[W * 0.45, W * 0.30, W * 0.25]
    )
    style = _dark_table_style()
    # Highlight total row
    style.add("BACKGROUND", (0, -1), (-1, -1), SLATE)
    style.add("TEXTCOLOR",  (0, -1), (-1, -1), GREEN)
    style.add("FONTNAME",   (0, -1), (-1, -1), "Helvetica-Bold")
    cost_table.setStyle(style)
    story.append(cost_table)
    story.append(Spacer(1, 12))

    # ── Total Cost Banner ─────────────────────────────────────────────────────
    total_data = [[
        Paragraph("ESTIMATED TOTAL COST", styles["ReportSubtitle"]),
    ], [
        Paragraph(_format_cost(total_cost), styles["TotalCost"]),
    ]]
    total_table = Table(total_data, colWidths=[W])
    total_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story.append(total_table)
    story.append(Spacer(1, 12))

    # ── Room Details ──────────────────────────────────────────────────────────
    rooms = report.get("rooms", [])
    if rooms:
        story.append(
            Paragraph("Room Details", styles["SectionTitle"])
        )

        room_rows = [[
            Paragraph("#",          styles["BodyWhite"]),
            Paragraph("Room Type",  styles["BodyWhite"]),
            Paragraph("Area (sqft)", styles["BodyWhite"]),
            Paragraph("Dimensions", styles["BodyWhite"]),
            Paragraph("Doors",      styles["BodyWhite"]),
            Paragraph("Windows",    styles["BodyWhite"]),
        ]]

        for i, room in enumerate(rooms, 1):
            area = room.get("area_sqft", 0)
            w    = room.get("width_ft")  or room.get("width")
            h    = room.get("length_ft") or room.get("height")
            dims = f"{w:.1f}' × {h:.1f}'" if w and h else "—"

            room_rows.append([
                Paragraph(str(i),                               styles["BodyGray"]),
                Paragraph(
                    room.get("type") or room.get("label") or "Room",
                    styles["BodyWhite"]
                ),
                Paragraph(f"{area:,.0f}",                       styles["BodyWhite"]),
                Paragraph(dims,                                  styles["BodyGray"]),
                Paragraph(str(room.get("doors",   0)),          styles["BodyWhite"]),
                Paragraph(str(room.get("windows", 0)),          styles["BodyWhite"]),
            ])

        room_table = Table(
            room_rows,
            colWidths=[
                W * 0.06, W * 0.28, W * 0.18,
                W * 0.22, W * 0.12, W * 0.14
            ]
        )
        room_table.setStyle(_dark_table_style())
        story.append(room_table)
        story.append(Spacer(1, 12))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width=W, color=SLATE_LIGHT))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generated by AI Smart Estimator  •  "
        f"{datetime.now().strftime('%d %b %Y %I:%M %p')}  •  "
        f"Confidential",
        styles["SmallCenter"]
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


# ══════════════════════════════════════════════════════════════════════════════
# 2. MANUAL ESTIMATION REPORT PDF
# ══════════════════════════════════════════════════════════════════════════════
def generate_manual_report_pdf(report: dict) -> BytesIO:
    """
    Generate PDF for manual estimation report.
    """
    buffer = BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = _build_styles()
    story  = []
    W      = A4[0] - 3 * cm

    # ── Header ────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("MANUAL ESTIMATION REPORT", styles["ReportTitle"]),
    ]]
    header_table = Table(header_data, colWidths=[W])
    header_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_BLUE),
        ("TOPPADDING",    (0, 0), (-1, -1), 20),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))

    # ── Project Info ──────────────────────────────────────────────────────────
    story.append(
        Paragraph("Project Information", styles["SectionTitle"])
    )

    info_data = [
        [
            Paragraph("Estimation Code", styles["BodyGray"]),
            Paragraph(
                str(report.get("estimation_code", "N/A")),
                styles["BodyWhite"]
            ),
            Paragraph("Project Name", styles["BodyGray"]),
            Paragraph(
                str(report.get("estimation_name", "N/A")),
                styles["BodyWhite"]
            ),
        ],
        [
            Paragraph("Total Area",   styles["BodyGray"]),
            Paragraph(
                f"{report.get('area_sqft', 0)} sqft "
                f"({report.get('area_m2', 0)} m²)",
                styles["BodyWhite"]
            ),
            Paragraph("Floors",       styles["BodyGray"]),
            Paragraph(
                str(report.get("floors", 1)),
                styles["BodyWhite"]
            ),
        ],
        [
            Paragraph("Mix Type",     styles["BodyGray"]),
            Paragraph(
                str(report.get("mix_type", "CUSTOM")),
                styles["BodyWhite"]
            ),
            Paragraph("Wastage",      styles["BodyGray"]),
            Paragraph(
                f"{report.get('wastage_percent', 0)}%",
                styles["BodyWhite"]
            ),
        ],
    ]
    info_table = Table(
        info_data,
        colWidths=[W * 0.18, W * 0.32, W * 0.18, W * 0.32]
    )
    info_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("GRID",          (0, 0), (-1, -1), 0.3, SLATE_LIGHT),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # ── Mix Ratio ─────────────────────────────────────────────────────────────
    mix_ratio = report.get("mix_ratio")
    if mix_ratio:
        story.append(
            Paragraph("Concrete Mix Ratio", styles["SectionTitle"])
        )
        ratio_data = [[
            Paragraph(
                f"Cement : Sand : Aggregate  =  "
                f"{mix_ratio.get('cement')} : "
                f"{mix_ratio.get('sand')} : "
                f"{mix_ratio.get('aggregate')}",
                styles["BodyWhite"]
            )
        ]]
        ratio_table = Table(ratio_data, colWidths=[W])
        ratio_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), DARK_BLUE),
            ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING",    (0, 0), (-1, -1), 12),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ]))
        story.append(ratio_table)
        story.append(Spacer(1, 8))

    # ── Concrete Volumes ──────────────────────────────────────────────────────
    if report.get("concrete_volume_m3") or report.get("dry_volume_m3"):
        story.append(
            Paragraph("Concrete Volumes", styles["SectionTitle"])
        )
        vol_data = [[
            Paragraph("Wet Volume (m³)", styles["BodyGray"]),
            Paragraph(
                str(report.get("concrete_volume_m3", 0)),
                styles["BodyWhite"]
            ),
            Paragraph("Dry Volume (m³)", styles["BodyGray"]),
            Paragraph(
                str(report.get("dry_volume_m3", 0)),
                styles["BodyWhite"]
            ),
        ]]
        vol_table = Table(
            vol_data,
            colWidths=[W * 0.25] * 4
        )
        vol_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
            ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ("GRID",          (0, 0), (-1, -1), 0.3, SLATE_LIGHT),
        ]))
        story.append(vol_table)
        story.append(Spacer(1, 8))

    # ── Materials Required ────────────────────────────────────────────────────
    materials = report.get("materials", {})
    if materials:
        story.append(
            Paragraph("Materials Required", styles["SectionTitle"])
        )

        mat_map = {
            "steel_kg":      ("Steel",     "kg"),
            "cement_bags":   ("Cement",    "bags"),
            "sand_ton":      ("Sand",      "tons"),
            "aggregate_ton": ("Aggregate", "tons"),
            "bricks":        ("Bricks",    "units"),
            "paint_liters":  ("Paint",     "liters"),
        }

        mat_rows = [[
            Paragraph("Material",  styles["BodyWhite"]),
            Paragraph("Quantity",  styles["BodyWhite"]),
            Paragraph("Unit",      styles["BodyWhite"]),
        ]]
        for key, (label, unit) in mat_map.items():
            val = materials.get(key)
            if val:
                mat_rows.append([
                    Paragraph(label,    styles["BodyWhite"]),
                    Paragraph(str(val), styles["BodyWhite"]),
                    Paragraph(unit,     styles["BodyGray"]),
                ])

        mat_table = Table(
            mat_rows,
            colWidths=[W * 0.45, W * 0.30, W * 0.25]
        )
        mat_table.setStyle(_dark_table_style())
        story.append(mat_table)
        story.append(Spacer(1, 8))

    # ── Material Rates ────────────────────────────────────────────────────────
    rates = report.get("rates", {})
    if rates:
        story.append(
            Paragraph("Material Rates Used", styles["SectionTitle"])
        )

        rate_map = {
            "steel_per_kg":      ("Steel Rate",     "per kg"),
            "cement_per_bag":    ("Cement Rate",    "per bag"),
            "sand_per_ton":      ("Sand Rate",      "per ton"),
            "aggregate_per_ton": ("Aggregate Rate", "per ton"),
            "brick_per_unit":    ("Brick Rate",     "per unit"),
            "paint_per_liter":   ("Paint Rate",     "per liter"),
        }

        rate_rows = [[
            Paragraph("Item",   styles["BodyWhite"]),
            Paragraph("Rate",   styles["BodyWhite"]),
            Paragraph("Unit",   styles["BodyWhite"]),
        ]]
        for key, (label, unit) in rate_map.items():
            val = rates.get(key)
            if val:
                rate_rows.append([
                    Paragraph(label,          styles["BodyWhite"]),
                    Paragraph(f"Rs {val}",    styles["BodyWhite"]),
                    Paragraph(unit,           styles["BodyGray"]),
                ])

        rate_table = Table(
            rate_rows,
            colWidths=[W * 0.45, W * 0.30, W * 0.25]
        )
        rate_table.setStyle(_dark_table_style())
        story.append(rate_table)
        story.append(Spacer(1, 8))

    # ── Cost Summary ──────────────────────────────────────────────────────────
    costs = report.get("costs", [])
    if costs:
        story.append(
            Paragraph("Cost Summary", styles["SectionTitle"])
        )

        cost_rows = [[
            Paragraph("Material Type", styles["BodyWhite"]),
            Paragraph("Total Cost",    styles["BodyWhite"]),
        ]]
        total = 0
        for cost in costs:
            mat_type = cost.get("material_type", "Unknown").capitalize()
            amount   = cost.get("total_cost", 0)
            total   += amount
            cost_rows.append([
                Paragraph(mat_type,            styles["BodyWhite"]),
                Paragraph(_format_cost(amount), styles["BodyWhite"]),
            ])

        cost_rows.append([
            Paragraph("<b>TOTAL</b>",          styles["BodyWhite"]),
            Paragraph(
                f"<b>{_format_cost(total)}</b>",
                styles["BodyWhite"]
            ),
        ])

        cost_table = Table(
            cost_rows,
            colWidths=[W * 0.60, W * 0.40]
        )
        style = _dark_table_style()
        style.add("BACKGROUND", (0, -1), (-1, -1), SLATE)
        style.add("TEXTCOLOR",  (0, -1), (-1, -1), GREEN)
        style.add("FONTNAME",   (0, -1), (-1, -1), "Helvetica-Bold")
        cost_table.setStyle(style)
        story.append(cost_table)
        story.append(Spacer(1, 8))

    # ── Total Cost Banner ─────────────────────────────────────────────────────
    total_cost = report.get("total_cost", 0)
    if total_cost:
        total_data = [[
            Paragraph("TOTAL ESTIMATED COST", styles["ReportSubtitle"]),
        ], [
            Paragraph(_format_cost(total_cost), styles["TotalCost"]),
        ]]
        total_table = Table(total_data, colWidths=[W])
        total_table.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
            ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING",    (0, 0), (-1, -1), 14),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ]))
        story.append(total_table)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 12))
    story.append(HRFlowable(width=W, color=SLATE_LIGHT))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generated by AI Smart Estimator  •  "
        f"{datetime.now().strftime('%d %b %Y %I:%M %p')}  •  "
        f"Confidential",
        styles["SmallCenter"]
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


# ══════════════════════════════════════════════════════════════════════════════
# 3. 3D MODEL REPORT PDF  (summary — GLB is downloaded separately)
# ══════════════════════════════════════════════════════════════════════════════
def generate_3d_report_pdf(metadata: dict, project_id: int) -> BytesIO:
    """
    Generate a summary PDF for the 3D model report.
    metadata keys: wall_count, door_count, window_count,
                   file_size, generation_time
    """
    buffer = BytesIO()
    doc    = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=1.5 * cm,
        rightMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )

    styles = _build_styles()
    story  = []
    W      = A4[0] - 3 * cm

    # ── Header ────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("3D MODEL GENERATION REPORT", styles["ReportTitle"]),
    ]]
    header_table = Table(header_data, colWidths=[W])
    header_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_BLUE),
        ("TOPPADDING",    (0, 0), (-1, -1), 20),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))

    # ── Project Info ──────────────────────────────────────────────────────────
    story.append(
        Paragraph("Model Information", styles["SectionTitle"])
    )

    # Format file size
    size_bytes = metadata.get("file_size", 0)
    if size_bytes >= 1024 * 1024:
        size_str = f"{size_bytes / (1024 * 1024):.1f} MB"
    elif size_bytes >= 1024:
        size_str = f"{size_bytes / 1024:.1f} KB"
    else:
        size_str = f"{size_bytes} B"

    info_data = [
        [
            Paragraph("Project ID",       styles["BodyGray"]),
            Paragraph(f"#{project_id}",   styles["BodyWhite"]),
            Paragraph("Generated On",     styles["BodyGray"]),
            Paragraph(
                datetime.now().strftime("%d %b %Y, %I:%M %p"),
                styles["BodyWhite"]
            ),
        ],
        [
            Paragraph("File Size",         styles["BodyGray"]),
            Paragraph(size_str,            styles["BodyWhite"]),
            Paragraph("Generation Time",   styles["BodyGray"]),
            Paragraph(
                f"{float(metadata.get('generation_time', 0)):.2f}s",
                styles["BodyWhite"]
            ),
        ],
        [
            Paragraph("File Format",       styles["BodyGray"]),
            Paragraph("GLB (Binary GLTF)", styles["BodyWhite"]),
            Paragraph("Status",            styles["BodyGray"]),
            Paragraph("  Generated",       styles["BodyWhite"]),
        ],
    ]
    info_table = Table(
        info_data,
        colWidths=[W * 0.18, W * 0.32, W * 0.18, W * 0.32]
    )
    info_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("GRID",          (0, 0), (-1, -1), 0.3, SLATE_LIGHT),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 12))

    # ── Model Stats ───────────────────────────────────────────────────────────
    story.append(
        Paragraph("Model Statistics", styles["SectionTitle"])
    )

    stats_data = [[
        Paragraph(
            f"<b>{metadata.get('wall_count', 0)}</b><br/>"
            f"<font color='#94a3b8' size=8>Walls Generated</font>",
            styles["BodyWhite"]
        ),
        Paragraph(
            f"<b>{metadata.get('door_count', 0)}</b><br/>"
            f"<font color='#94a3b8' size=8>Doors Placed</font>",
            styles["BodyWhite"]
        ),
        Paragraph(
            f"<b>{metadata.get('window_count', 0)}</b><br/>"
            f"<font color='#94a3b8' size=8>Windows Placed</font>",
            styles["BodyWhite"]
        ),
    ]]
    stats_table = Table(
        stats_data,
        colWidths=[W / 3] * 3
    )
    stats_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_BLUE),
        ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING",    (0, 0), (-1, -1), 20),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 20),
        ("GRID",          (0, 0), (-1, -1), 0.5, SLATE_LIGHT),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 12))

    # ── GLB Download Notice ───────────────────────────────────────────────────
    notice_data = [[
        Paragraph(
            "The 3D model (GLB file) can be downloaded directly from the "
            "3D Viewer page. GLB files are compatible with Blender, Unity, "
            "Unreal Engine, and all major 3D software.",
            styles["BodyGray"]
        )
    ]]
    notice_table = Table(notice_data, colWidths=[W])
    notice_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SLATE),
        ("TOPPADDING",    (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
    ]))
    story.append(notice_table)

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width=W, color=SLATE_LIGHT))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generated by AI Smart Estimator  •  "
        f"{datetime.now().strftime('%d %b %Y %I:%M %p')}  •  "
        f"Confidential",
        styles["SmallCenter"]
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer