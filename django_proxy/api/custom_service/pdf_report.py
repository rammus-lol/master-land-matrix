import io
from datetime import datetime

import pandas as pd
from reportlab.graphics.charts.barcharts import HorizontalBarChart
from reportlab.graphics.shapes import Drawing, String
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def _truncate_value(value, max_len=32):
    text = str(value)
    if len(text) <= max_len:
        return text
    return text[: max_len - 1] + "…"


def _select_count_charts(table: pd.DataFrame, max_columns=3, max_categories=8):
    chart_candidates = []
    if table.empty:
        return chart_candidates

    max_unique_allowed = max(2, min(20, int(len(table) * 0.5)))
    preferred_prefixes = [
        "current_intention_of_investment",
        "current_intention_of_invest",
        "country",
    ]

    def _build_counts(series, force_include=False):
        if pd.api.types.is_numeric_dtype(series):
            return None

        cleaned = series.fillna("N/A").astype(str).str.strip()
        cleaned = cleaned[cleaned != ""]
        if cleaned.empty:
            return None

        unique_count = cleaned.nunique()
        if not force_include and (unique_count < 2 or unique_count > max_unique_allowed):
            return None
        if force_include and unique_count < 1:
            return None

        counts = cleaned.value_counts().head(max_categories)
        if len(counts) < 2 and not force_include:
            return None
        return counts

    selected_columns = set()

    for column_name in table.columns:
        column_lower = str(column_name).lower()
        if any(column_lower.startswith(prefix) for prefix in preferred_prefixes):
            counts = _build_counts(table[column_name], force_include=True)
            if counts is not None:
                chart_candidates.append((column_name, counts))
                selected_columns.add(column_name)

    for column_name in table.columns:
        if column_name in selected_columns:
            continue

        counts = _build_counts(table[column_name], force_include=False)
        if counts is not None:
            chart_candidates.append((column_name, counts))

    preferred = [
        item for item in chart_candidates
        if any(str(item[0]).lower().startswith(prefix) for prefix in preferred_prefixes)
    ]
    others = [
        item for item in chart_candidates
        if not any(str(item[0]).lower().startswith(prefix) for prefix in preferred_prefixes)
    ]

    others.sort(key=lambda item: item[1].sum(), reverse=True)
    ordered = preferred + others
    return ordered[:max_columns]


def build_pdf_report(table: pd.DataFrame) -> bytes:
    output = io.BytesIO()
    doc = SimpleDocTemplate(
        output,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="Land Matrix Report",
    )

    styles = getSampleStyleSheet()
    elements = []
    title_color = colors.HexColor("#1F4E79")
    accent_color = colors.HexColor("#2A9D8F")
    text_grey = colors.HexColor("#4A4A4A")

    normal_style = styles["Normal"]
    normal_style.fontName = "Helvetica"
    normal_style.fontSize = 9
    normal_style.leading = 11

    cell_style = styles["BodyText"].clone("cellStyle")
    cell_style.fontName = "Helvetica"
    cell_style.fontSize = 8
    cell_style.leading = 10

    header_style = styles["BodyText"].clone("headerStyle")
    header_style.fontName = "Helvetica-Bold"
    header_style.fontSize = 8
    header_style.leading = 10

    detail_cell_style = styles["BodyText"].clone("detailCellStyle")
    detail_cell_style.fontName = "Helvetica"
    detail_cell_style.fontSize = 7
    detail_cell_style.leading = 8

    section_style = styles["Heading3"].clone("sectionStyle")
    section_style.textColor = title_color
    section_style.fontName = "Helvetica-Bold"

    elements.append(Paragraph("Land Matrix — PDF Report", styles["Title"]))
    elements.append(Spacer(1, 2))
    separator = Table([[""]], colWidths=[A4[0] - 32 * mm], rowHeights=[3])
    separator.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), accent_color),
            ("LINEBELOW", (0, 0), (-1, -1), 0, accent_color),
        ])
    )
    elements.append(separator)
    elements.append(Spacer(1, 6))
    elements.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Deals: {len(table)} | Columns: {len(table.columns)}",
            normal_style,
        )
    )
    elements.append(Spacer(1, 10))

    if table.empty:
        elements.append(Paragraph("No result available for the selected IDs.", styles["Heading3"]))
        doc.build(elements)
        output.seek(0)
        return output.getvalue()

    preview_cols = list(table.columns[:4])
    preview_rows = table[preview_cols].head(15).fillna("N/A")

    table_data = [[Paragraph(_truncate_value(col, 28), header_style) for col in preview_cols]]
    for _, row in preview_rows.iterrows():
        table_data.append([Paragraph(_truncate_value(row[col], 90), cell_style) for col in preview_cols])

    available_width = A4[0] - 32 * mm
    width_weights = []
    for col in preview_cols:
        sample_text = [str(col)] + [str(value) for value in preview_rows[col].head(8).tolist()]
        max_len = max(len(text) for text in sample_text) if sample_text else 10
        width_weights.append(min(max(max_len, 12), 28))

    total_weight = sum(width_weights) if width_weights else 1
    col_widths = [available_width * (weight / total_weight) for weight in width_weights]

    preview = Table(table_data, colWidths=col_widths, repeatRows=1)
    preview.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), title_color),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#F7FAFC")]),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#B8C2CC")),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    elements.append(Paragraph("Preview of results", section_style))
    elements.append(preview)
    elements.append(Spacer(1, 12))
    if len(table.columns) > len(preview_cols):
        elements.append(
            Paragraph(
                f"Displayed columns: {', '.join(preview_cols)}. Additional columns are available in CSV/XLSX export.",
                styles["Italic"],
            )
        )
        elements.append(Spacer(1, 8))

    chart_specs = _select_count_charts(table)
    if chart_specs:
        elements.append(Paragraph("Charts by number of results", section_style))
        elements.append(Spacer(1, 4))

    chart_color = colors.HexColor("#2A9D8F")

    for chart_index, (column_name, counts) in enumerate(chart_specs):
        full_labels = [str(label) for label in counts.index.tolist()]
        labels = [_truncate_value(label, 24) for label in full_labels]
        values = counts.values.tolist()
        max_value = max(values)
        total_values = sum(values)
        max_label_width = max(stringWidth(lbl, "Helvetica", 7) for lbl in labels)

        drawing = Drawing(500, 190)
        title = _truncate_value(column_name, 42)
        drawing.add(String(20, 172, f"Distribution by {title}", fontName="Helvetica-Bold", fontSize=10, fillColor=title_color))
        drawing.add(String(20, 160, "Bar length and labels represent the number of deals.", fontName="Helvetica", fontSize=7, fillColor=text_grey))

        bar_x = min(170, max(105, int(max_label_width) + 18))
        bar_right_limit = 470
        bar_width = max(155, bar_right_limit - bar_x)

        chart = HorizontalBarChart()
        chart.x = bar_x
        chart.y = 24
        chart.height = 125
        chart.width = bar_width
        chart.data = [values]
        chart.strokeColor = colors.HexColor("#8795A1")
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueMax = max_value + max(1, int(max_value * 0.15))
        chart.valueAxis.valueStep = max(1, int(chart.valueAxis.valueMax / 5))
        chart.categoryAxis.categoryNames = list(reversed(labels))
        chart.data = [list(reversed(values))]
        chart.categoryAxis.labels.fontSize = 7
        chart.categoryAxis.labels.fillColor = text_grey
        chart.categoryAxis.labels.dx = -4
        chart.valueAxis.labels.fontSize = 7
        chart.valueAxis.labels.fillColor = text_grey
        chart.bars[0].fillColor = chart_color
        chart.barSpacing = 4
        chart.groupSpacing = 8
        chart.barLabelFormat = '%d'
        chart.barLabels.nudge = 6
        chart.barLabels.fontSize = 7
        chart.barLabels.fillColor = text_grey
        chart.barLabels.boxAnchor = 'w'
        drawing.add(chart)

        if max_label_width > 105:
            chart.categoryAxis.labels.fontSize = 6
        if max_label_width > 130:
            chart.categoryAxis.labels.fontSize = 5.5

        elements.append(drawing)

        detail_rows = [["Category", "Count", "Share"]]
        for full_lab, val in zip(full_labels, values):
            share = 0 if total_values == 0 else (val / total_values) * 100
            detail_rows.append([Paragraph(full_lab, detail_cell_style), str(val), f"{share:.1f}%"])

        detail_table = Table(detail_rows, colWidths=[105 * mm, 20 * mm, 20 * mm], repeatRows=1)
        detail_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF4F3")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F4E79")),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#B8C2CC")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        elements.append(detail_table)
        elements.append(Spacer(1, 10))

    doc.build(elements)
    output.seek(0)
    return output.getvalue()
