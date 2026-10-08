/**
 * CAMPUS AI - Fee Management UI Helpers
 */

function initiateFeePayment(feeId, invoiceNo, title, balance) {
  const form = document.getElementById('payFeeForm');
  if (form) {
    form.action = `/fees/${feeId}/pay`;
    document.getElementById('payInvoiceNo').textContent = invoiceNo;
    document.getElementById('payTitle').textContent = title;
    document.getElementById('payBalance').textContent = `₹ ${balance.toLocaleString('en-IN')}`;
    document.getElementById('payAmountInput').value = balance;
  }
  openModal('payFeeModal');
}

function triggerFeeReminder(feeId, studentName) {
  if (confirm(`Dispatch automated email reminder for this fee invoice to ${studentName}?`)) {
    fetch(`/fees/${feeId}/reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast(data.message, 'success');
        } else {
          showToast(data.message || 'Failed to dispatch reminder', 'error');
        }
      })
      .catch(() => showToast('Network error dispatching reminder', 'error'));
  }
}

window.initiateFeePayment = initiateFeePayment;
window.triggerFeeReminder = triggerFeeReminder;
