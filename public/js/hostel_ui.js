/**
 * CAMPUS AI - Hostel Management UI Helpers
 */

function allocateRoomModal(roomId, block, roomNumber, bedNumber) {
  document.getElementById('allocRoomId').value = roomId;
  document.getElementById('allocRoomDetails').textContent = `${block} — Room ${roomNumber} (${bedNumber})`;
  openModal('allocateModal');
}

window.allocateRoomModal = allocateRoomModal;
