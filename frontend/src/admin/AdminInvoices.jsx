import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download } from 'lucide-react';
import { LoadingPage, PaymentStatusTag, formatDate } from '../components/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices').then(r => setInvoices(r.data)).finally(() => setLoading(false));
  }, []);

  const downloadInvoice = async (orderId, invoiceNumber) => {
    try {
      const r = await api.get(`/invoices/order/${orderId}`);
      const inv = r.data;
      generatePDF(inv);
    } catch { alert('Could not load invoice'); }
  };

  const generatePDF = (inv) => {
    const doc = new jsPDF();
    const s = inv.settings || {};

    // Header
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.setTextColor(194, 68, 15);
    doc.text('MBI BRICKS INDUSTRIES', 20, 25);

    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(s.business_address || 'H96P+4X5, Bommenahalli, Handanakere Hobli, C N Halli Tq, Karnataka 572119', 20, 32);
    doc.text(`Phone: ${s.business_phone || '+91 98765 43210'}`, 20, 38);
    doc.text(`Email: ${s.business_email || 'contact@mbibricks.com'}`, 20, 44);
    doc.text(`Owner: ${s.owner_name || 'Nandakumar B C'}`, 20, 50);
    if (s.gst_number) doc.text(`GST: ${s.gst_number}`, 20, 56);

    // Invoice title
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('INVOICE', 150, 25);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice #: ${inv.invoice_number}`, 150, 32);
    doc.text(`Order: ${inv.order_number}`, 150, 38);
    doc.text(`Date: ${formatDate(inv.generated_at)}`, 150, 44);

    // Customer
    doc.setDrawColor(200, 200, 200); doc.line(20, 58, 190, 58);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text('Bill To:', 20, 66);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(inv.customer_name || '—', 20, 73);
    doc.text(inv.customer_phone || '', 20, 79);
    doc.text(inv.customer_email || '', 20, 85);
    const addr = [inv.delivery_house, inv.delivery_street, inv.delivery_area, inv.delivery_city, inv.delivery_state, inv.delivery_pincode].filter(Boolean).join(', ');
    if (addr) doc.text(addr, 20, 91, { maxWidth: 160 });

    // Items table
    autoTable(doc, {
      startY: 105,
      head: [['#', 'Product', 'Qty', 'Rate (₹)', 'Amount (₹)']],
      body: inv.items?.map((item, i) => [
        i + 1,
        item.product_name,
        item.quantity?.toLocaleString('en-IN'),
        item.price?.toLocaleString('en-IN'),
        item.subtotal?.toLocaleString('en-IN'),
      ]),
      headStyles: { fillColor: [194, 68, 15], textColor: 255 },
      alternateRowStyles: { fillColor: [252, 248, 245] },
      styles: { fontSize: 10 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Totals
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 130, finalY); doc.text(`₹${inv.subtotal?.toLocaleString('en-IN')}`, 175, finalY, { align: 'right' });
    doc.text(`Delivery Charge:`, 130, finalY + 7); doc.text(`₹${inv.delivery_charge?.toLocaleString('en-IN')}`, 175, finalY + 7, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total:`, 130, finalY + 16); doc.text(`₹${inv.total?.toLocaleString('en-IN')}`, 175, finalY + 16, { align: 'right' });

    const totalPaid = inv.payments?.reduce((s, p) => s + p.amount, 0) || 0;
    const remaining = inv.total - totalPaid;
    doc.setFont('helvetica', 'normal');
    doc.text(`Amount Paid:`, 130, finalY + 24); doc.text(`₹${totalPaid.toLocaleString('en-IN')}`, 175, finalY + 24, { align: 'right' });
    if (remaining > 0) {
      doc.setTextColor(220, 50, 50);
      doc.text(`Balance Due:`, 130, finalY + 31); doc.text(`₹${remaining.toLocaleString('en-IN')}`, 175, finalY + 31, { align: 'right' });
    }

    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text('Thank you for your business! For queries: contact@mbibricks.com', 20, 280);

    doc.save(`${inv.invoice_number}.pdf`);
  };

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Invoices</h1>
      <p className="admin-page-subtitle">{invoices.length} invoices generated</p>

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Invoice #</th><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:48, color:'var(--text-muted)' }}>No invoices yet. Generate from an order.</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight:800, color:'var(--primary)' }}>{inv.invoice_number}</td>
                  <td><Link to={`/admin/orders/${inv.order_id}`} style={{ color:'var(--primary)', fontWeight:600 }}>{inv.order_number}</Link></td>
                  <td>{inv.customer_name}</td>
                  <td style={{ fontWeight:700, color:'var(--accent)' }}>₹{inv.total?.toLocaleString('en-IN')}</td>
                  <td><PaymentStatusTag status={inv.payment_status}/></td>
                  <td><span className={`tag tag-${inv.order_status}`}>{inv.order_status}</span></td>
                  <td style={{ fontSize:13, color:'var(--text-muted)' }}>{formatDate(inv.generated_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => downloadInvoice(inv.order_id, inv.invoice_number)}>
                        <Download size={14}/> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
