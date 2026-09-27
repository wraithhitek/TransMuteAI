import os
from typing import Dict, Any, Optional
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

from app.api.schemas import ContentBriefJSON
from app.services.renderers.base import BaseRenderer

class AdvisoryRenderer(BaseRenderer):
    """
    Renders structured Strategic Advisory documents with:
    - Executive Mandate & Strategic Context
    - Risk Assessment Matrix (Severity, Likelihood, Mitigation)
    - Phased Execution Roadmap (30-60-90 Day Milestones)
    - Governance & Policy Directives
    """

    PRIMARY_COLOR = RGBColor(15, 23, 42)      # Slate 900
    ACCENT_COLOR = RGBColor(16, 185, 129)     # Emerald 600
    MUTED_COLOR = RGBColor(100, 116, 139)     # Slate 500

    def _set_cell_background(self, cell, hex_color: str):
        shading = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
        cell._tc.get_or_add_tcPr().append(shading)

    def render(self, brief: ContentBriefJSON, output_path: str, extra_context: Optional[Dict[str, Any]] = None) -> str:
        advisory = brief.advisory_document
        doc = Document()

        for section in doc.sections:
            section.top_margin = Inches(0.8)
            section.bottom_margin = Inches(0.8)
            section.left_margin = Inches(0.8)
            section.right_margin = Inches(0.8)

        # Document Header
        title_para = doc.add_paragraph()
        run_title = title_para.add_run(f"Strategic Advisory: {brief.title}")
        run_title.font.name = "Calibri"
        run_title.font.size = Pt(22)
        run_title.font.bold = True
        run_title.font.color.rgb = self.PRIMARY_COLOR

        sub_para = doc.add_paragraph()
        run_sub = sub_para.add_run("Executive Advisory Memo & Risk Mitigation Roadmap")
        run_sub.font.size = Pt(11)
        run_sub.font.color.rgb = self.ACCENT_COLOR
        run_sub.font.bold = True

        # Executive Mandate Callout Box
        mandate_table = doc.add_table(rows=1, cols=1)
        m_cell = mandate_table.rows[0].cells[0]
        self._set_cell_background(m_cell, "ECFDF5")  # Emerald-50
        p_m = m_cell.paragraphs[0]
        p_m.paragraph_format.space_before = Pt(6)
        p_m.paragraph_format.space_after = Pt(6)
        r_m_lbl = p_m.add_run("EXECUTIVE MANDATE & STRATEGIC OBJECTIVE\n")
        r_m_lbl.font.size = Pt(9)
        r_m_lbl.font.bold = True
        r_m_lbl.font.color.rgb = self.ACCENT_COLOR
        r_m_val = p_m.add_run(advisory.executive_mandate if advisory else brief.summary)
        r_m_val.font.size = Pt(10.5)

        doc.add_paragraph().paragraph_format.space_after = Pt(10)

        # Strategic Context
        h_ctx = doc.add_paragraph()
        r_ctx = h_ctx.add_run("1. Strategic Context & Driving Factors")
        r_ctx.font.size = Pt(14)
        r_ctx.font.bold = True
        r_ctx.font.color.rgb = self.PRIMARY_COLOR

        p_ctx = doc.add_paragraph(advisory.strategic_context if (advisory and advisory.strategic_context) else brief.executive_summary.context)
        p_ctx.paragraph_format.space_after = Pt(10)

        # Risk Assessment Matrix Table
        h_risk = doc.add_paragraph()
        r_risk = h_risk.add_run("2. Strategic Risk Matrix & Mitigation Directives")
        r_risk.font.size = Pt(14)
        r_risk.font.bold = True
        r_risk.font.color.rgb = self.PRIMARY_COLOR

        risks = advisory.risk_matrix if (advisory and advisory.risk_matrix) else []
        if risks:
            risk_table = doc.add_table(rows=1, cols=4)
            risk_table.alignment = WD_TABLE_ALIGNMENT.CENTER
            headers = ["Risk Factor", "Severity", "Likelihood", "Tactical Mitigation Strategy"]
            for idx, h_text in enumerate(headers):
                cell = risk_table.rows[0].cells[idx]
                self._set_cell_background(cell, "1E293B")
                p = cell.paragraphs[0]
                r = p.add_run(h_text)
                r.font.bold = True
                r.font.size = Pt(9)
                r.font.color.rgb = RGBColor(255, 255, 255)

            for item in risks:
                row = risk_table.add_row()
                # Col 0: Risk Factor
                self._set_cell_background(row.cells[0], "F8FAFC")
                p0 = row.cells[0].paragraphs[0]
                r0 = p0.add_run(item.risk_factor)
                r0.font.bold = True
                r0.font.size = Pt(9.5)

                # Col 1: Severity
                self._set_cell_background(row.cells[1], "FEF2F2" if item.severity in ("Critical", "High") else "FFFBEB")
                p1 = row.cells[1].paragraphs[0]
                r1 = p1.add_run(item.severity)
                r1.font.bold = True
                r1.font.size = Pt(9)
                r1.font.color.rgb = RGBColor(220, 38, 38) if item.severity in ("Critical", "High") else RGBColor(217, 119, 6)

                # Col 2: Likelihood
                self._set_cell_background(row.cells[2], "F8FAFC")
                p2 = row.cells[2].paragraphs[0]
                r2 = p2.add_run(item.likelihood)
                r2.font.size = Pt(9)

                # Col 3: Mitigation
                self._set_cell_background(row.cells[3], "FFFFFF")
                p3 = row.cells[3].paragraphs[0]
                r3 = p3.add_run(item.mitigation_strategy)
                r3.font.size = Pt(9.5)

        doc.add_paragraph().paragraph_format.space_after = Pt(10)

        # Phased Implementation Roadmap
        h_road = doc.add_paragraph()
        r_road = h_road.add_run("3. Phased Execution Roadmap")
        r_road.font.size = Pt(14)
        r_road.font.bold = True
        r_road.font.color.rgb = self.PRIMARY_COLOR

        roadmap = advisory.phased_roadmap if (advisory and advisory.phased_roadmap) else []
        for phase in roadmap:
            p_ph = doc.add_paragraph()
            r_ph_title = p_ph.add_run(f"▸ {phase.phase} ({phase.timeframe})\n")
            r_ph_title.font.bold = True
            r_ph_title.font.size = Pt(11)
            r_ph_title.font.color.rgb = self.ACCENT_COLOR

            for act in phase.actions:
                p_act = doc.add_paragraph(style='List Bullet')
                r_a = p_act.add_run(act)
                r_a.font.size = Pt(9.5)

        # Governance & Compliance
        doc.add_paragraph().paragraph_format.space_after = Pt(10)
        h_gov = doc.add_paragraph()
        r_gov = h_gov.add_run("4. Governance & Compliance Directives")
        r_gov.font.size = Pt(14)
        r_gov.font.bold = True
        r_gov.font.color.rgb = self.PRIMARY_COLOR

        gov_items = advisory.governance_framework if (advisory and advisory.governance_framework) else brief.executive_summary.strategic_recommendations
        for gov in gov_items:
            p_g = doc.add_paragraph(style='List Bullet')
            r_g = p_g.add_run(gov)
            r_g.font.size = Pt(9.5)

        # Embed QR Code
        qr_path = extra_context.get("qr_code_path") if extra_context else None
        if qr_path and os.path.exists(qr_path):
            doc.add_paragraph().paragraph_format.space_after = Pt(12)
            qr_para = doc.add_paragraph()
            qr_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            qr_para.add_run().add_picture(qr_path, width=Inches(1.3))
            cap = doc.add_paragraph("Scan to Verify Strategic Advisory Provenance")
            cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            cap.runs[0].font.size = Pt(8)
            cap.runs[0].font.italic = True
            cap.runs[0].font.color.rgb = self.MUTED_COLOR

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        doc.save(output_path)
        return os.path.abspath(output_path)
