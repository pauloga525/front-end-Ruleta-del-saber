// /src/components/Modal.jsx
import React from "react";

export default function Modal({ visible, title, children, onClose }) {
  if (!visible) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div>{children}</div>
        <button onClick={onClose} style={styles.btnPrimary}>Cerrar</button>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 999
  },

  modalContent: {
    background: '#fff', padding: 20, borderRadius: 10, minWidth: 280
  },

  btnPrimary: {
    padding: '10px 18px', borderRadius: 8, border: 'none',
    background: '#2563eb', color: '#fff', cursor: 'pointer'
  }
};
