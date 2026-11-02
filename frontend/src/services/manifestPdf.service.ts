import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface RouteManifestStop {
  sequence: number;
  externalRef?: string;
  customerName: string;
  customerPhone?: string;
  address: string;
  notes?: string;
  timeWindow?: string;
  weightKg: number;
  status?: string;
}

export interface RouteManifestData {
  manifestNumber: string;
  routeDate: string;
  companyName?: string;
  warehouseName: string;
  warehouseAddress: string;
  vehiclePlate: string;
  vehicleName?: string;
  vehicleCapacityKg: number;
  driverName?: string;
  driverPhone?: string;
  totalDistanceKm: number;
  totalDurationMin: number;
  totalLoadKg: number;
  stops: RouteManifestStop[];
}

/**
 * Loads the company logo from /logo.png as a Base64 data URL.
 * Falls back to null if not reachable.
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Formats duration in minutes into clean "Xh Ym" string.
 */
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

/**
 * Generates an executive A4 delivery manifest & route sheet PDF.
 */
export async function generateRouteManifestPdf(data: RouteManifestData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;

  // Pre-load logo
  const logoData = await loadLogoBase64();

  // Color Palette
  const COLOR_PRIMARY = [37, 99, 235]; // #2563EB Blue
  const COLOR_DARK = [15, 23, 42]; // #0F172A Slate 900
  const COLOR_TEXT = [51, 65, 85]; // #334155 Slate 700
  const COLOR_MUTED = [100, 116, 139]; // #64748B Slate 500
  const COLOR_BORDER = [226, 232, 240]; // #E2E8F0 Slate 200
  const COLOR_BG_LIGHT = [248, 250, 252]; // #F8FAFC Slate 50
  const COLOR_EMERALD = [0, 197, 142]; // #00C58E Emerald

  let currentY = 14;

  // ==========================================
  // 1. CORPORATE HEADER
  // ==========================================
  // Top brand accent stripe
  doc.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.rect(marginX, currentY, contentWidth, 2, 'F');
  currentY += 6;

  // Left side: Logo + Tenant Name
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX, currentY, 14, 14);
    } catch {
      // Fallback if image embedding fails
    }
  }

  const brandTextX = logoData ? marginX + 17 : marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text('RouteFlow', brandTextX, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('LOGÍSTICA & DESPACHO INTELIGENTE VRP', brandTextX, currentY + 9);

  const tenantName = data.companyName || 'Centro de Operaciones Logísticas';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(tenantName.toUpperCase(), brandTextX, currentY + 13.5);

  // Right side: Document Title, Manifest Code, Emission Date
  const rightAlignX = pageWidth - marginX;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text('MANIFIESTO DE DESPACHO', rightAlignX, currentY + 4, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(`N° ${data.manifestNumber}`, rightAlignX, currentY + 9, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const now = new Date();
  const emissionStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
  doc.text(`Fecha Operación: ${data.routeDate}  |  Emisión: ${emissionStr}`, rightAlignX, currentY + 13.5, {
    align: 'right',
  });

  currentY += 19;

  // Thin separator line
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);
  currentY += 4;

  // ==========================================
  // 2. DISPATCH SUMMARY CARD (FICHA TÉCNICA)
  // ==========================================
  const cardHeight = 27;
  doc.setFillColor(COLOR_BG_LIGHT[0], COLOR_BG_LIGHT[1], COLOR_BG_LIGHT[2]);
  doc.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 2, 2, 'FD');

  const colWidth = contentWidth / 4;
  const col1X = marginX + 4;
  const col2X = marginX + colWidth + 2;
  const col3X = marginX + colWidth * 2 + 2;
  const col4X = marginX + colWidth * 3 + 2;

  // Column 1: Vehículo & Conductor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('VEHÍCULO / PLACA', col1X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(data.vehiclePlate, col1X, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(data.vehicleName || 'Unidad de Carga', col1X, currentY + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('CONDUCTOR ASIGNADO', col1X, currentY + 19.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(data.driverName || 'Por Asignar', col1X, currentY + 23.5);

  // Column 2: Bodega / Hub de Despacho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('BODEGA DE ORIGEN', col2X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  const splitWhName = doc.splitTextToSize(data.warehouseName || 'Centro Principal', colWidth - 4);
  doc.text(splitWhName, col2X, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  const splitWhAddr = doc.splitTextToSize(data.warehouseAddress || 'Dirección no registrada', colWidth - 4);
  doc.text(splitWhAddr, col2X, currentY + 16);

  // Column 3: Carga & Capacidad
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('CARGA & OCUPACIÓN', col3X, currentY + 5);

  const occupancyPct =
    data.vehicleCapacityKg > 0
      ? Math.round((data.totalLoadKg / data.vehicleCapacityKg) * 100)
      : 0;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
  doc.text(`${data.totalLoadKg.toLocaleString()} kg`, col3X, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text(`Capacidad: ${data.vehicleCapacityKg.toLocaleString()} kg (${occupancyPct}%)`, col3X, currentY + 14.5);

  // Mini occupancy bar
  const barWidth = colWidth - 8;
  const barHeight = 2.5;
  const fillWidth = Math.min(barWidth, (barWidth * occupancyPct) / 100);
  doc.setFillColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  doc.roundedRect(col3X, currentY + 17, barWidth, barHeight, 1, 1, 'F');
  
  const barColor =
    occupancyPct > 100
      ? [225, 29, 72] // Red if overloaded
      : occupancyPct >= 70
      ? COLOR_EMERALD // Emerald if well utilized
      : COLOR_PRIMARY; // Blue otherwise

  doc.setFillColor(barColor[0], barColor[1], barColor[2]);
  doc.roundedRect(col3X, currentY + 17, fillWidth, barHeight, 1, 1, 'F');

  // Column 4: Métricas VRP
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
  doc.text('ITINERARIO & PARADAS', col4X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  doc.text(`${data.stops.length} Entregas`, col4X, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(COLOR_TEXT[0], COLOR_TEXT[1], COLOR_TEXT[2]);
  doc.text(`Distancia Vial: ${data.totalDistanceKm} km`, col4X, currentY + 15);
  doc.text(`Tiempo Estimado: ${formatDuration(data.totalDurationMin)}`, col4X, currentY + 19.5);

  currentY += cardHeight + 5;

  // ==========================================
  // 3. TABLE OF SEQUENCED STOPS
  // ==========================================
  const tableRows = data.stops.map((stop) => {
    const customerInfo = stop.customerPhone
      ? `${stop.customerName}\nTel: ${stop.customerPhone}`
      : stop.customerName;

    const addressInfo = stop.notes
      ? `${stop.address}\n* ${stop.notes}`
      : stop.address;

    return [
      stop.sequence.toString(),
      stop.externalRef || `PED-${stop.sequence.toString().padStart(3, '0')}`,
      customerInfo,
      addressInfo,
      stop.timeWindow || 'Todo el día',
      `${stop.weightKg} kg`,
      '[  ] OK\n[  ] Nov.',
      '', // Blank box for receiver physical signature / ID
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX, bottom: 35 },
    head: [[
      '#',
      'Guía / Ref',
      'Destinatario',
      'Dirección de Entrega',
      'Ventana',
      'Carga',
      'Recibido',
      'Firma & C.C. Receptor',
    ]],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
      cellPadding: 2,
    },
    styles: {
      fontSize: 7,
      font: 'helvetica',
      textColor: [30, 41, 59],
      cellPadding: { top: 2.2, bottom: 2.2, left: 1.5, right: 1.5 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center', fontStyle: 'bold' }, // #
      1: { cellWidth: 22, fontStyle: 'bold' }, // Guia
      2: { cellWidth: 32 }, // Cliente
      3: { cellWidth: 46 }, // Direccion
      4: { cellWidth: 20 }, // Ventana
      5: { cellWidth: 15, halign: 'right' }, // Peso
      6: { cellWidth: 15, halign: 'center', fontSize: 6.5 }, // Checkbox
      7: { cellWidth: 24 }, // Firma
    },
  });

  // ==========================================
  // 4. FOOTER & SIGNATURE BLOCKS (ON LAST PAGE)
  // ==========================================
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    // If it's the last page, draw signature boxes
    if (page === totalPages) {
      const signY = pageHeight - 32;

      // Legal disclaimer
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text(
        'El transportador certifica haber recibido las mercancías en perfecto estado de conservación para su custodia y transporte según la ley vigente.',
        pageWidth / 2,
        signY - 4,
        { align: 'center' },
      );

      // Signature 1: Despachador
      const signBoxWidth = 65;
      const sign1X = marginX + 15;
      doc.setDrawColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
      doc.setLineWidth(0.4);
      doc.line(sign1X, signY + 12, sign1X + signBoxWidth, signY + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
      doc.text('Firma Despachador / Jefe de Bodega', sign1X + signBoxWidth / 2, signY + 16, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text('C.C. ________________________', sign1X + signBoxWidth / 2, signY + 20, {
        align: 'center',
      });

      // Signature 2: Conductor
      const sign2X = pageWidth - marginX - signBoxWidth - 15;
      doc.line(sign2X, signY + 12, sign2X + signBoxWidth, signY + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(COLOR_DARK[0], COLOR_DARK[1], COLOR_DARK[2]);
      doc.text('Firma Conductor Responsable', sign2X + signBoxWidth / 2, signY + 16, {
        align: 'center',
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
      doc.text(`C.C. / Licencia: ${data.vehiclePlate}`, sign2X + signBoxWidth / 2, signY + 20, {
        align: 'center',
      });
    }

    // Page Numbering & Bottom Bar
    const bottomY = pageHeight - 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLOR_MUTED[0], COLOR_MUTED[1], COLOR_MUTED[2]);
    doc.text('RouteFlow SaaS — Sistema de Optimización de Rutas VRP', marginX, bottomY);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - marginX, bottomY, {
      align: 'right',
    });
  }

  // Trigger browser download
  const cleanPlate = data.vehiclePlate.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Manifiesto_${data.manifestNumber}_${cleanPlate}.pdf`;
  doc.save(filename);
}
