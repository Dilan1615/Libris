import React, { useState, useMemo, useEffect } from 'react';

const AdminTable = ({ 
  title, 
  columns, 
  data, 
  onEdit, 
  onDelete, 
  isLoading,
  error,
  palette 
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Debounce para búsqueda (esperar 300ms después de dejar de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filtrado y búsqueda (usa el término debounced)
  const filteredData = useMemo(() => {
    let result = data || [];
    
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(row => {
        if (filterColumn) {
          return String(row[filterColumn] || '').toLowerCase().includes(term);
        }
        return columns.some(col => String(row[col.key] || '').toLowerCase().includes(term));
      });
    }
    
    return result;
  }, [data, debouncedSearchTerm, filterColumn, columns]);

  // Exportar a CSV
  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = columns.map(col => col.label);
    const rows = filteredData.map(row => columns.map(col => row[col.key] || ''));
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: palette.textLight }}>⏳ Cargando...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: palette.error }}>❌ Error: {error}</div>;
  }

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: palette.textLight }}>📭 No hay datos</div>;
  }

  const styles = {
    container: { marginBottom: '40px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
    title: { fontSize: '1.5rem', fontWeight: '700', color: palette.text },
    controls: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
    searchInput: { padding: '8px 12px', background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: '6px', color: palette.text, fontSize: '0.9rem', flex: '1', minWidth: '200px' },
    filterSelect: { padding: '8px 12px', background: palette.inputBg, border: `1px solid ${palette.inputBorder}`, borderRadius: '6px', color: palette.text, fontSize: '0.9rem', cursor: 'pointer' },
    exportBtn: { padding: '8px 16px', background: palette.primary, color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s ease' },
    tableContainer: { overflowX: 'auto', borderRadius: '10px', border: `1px solid ${palette.cardBorder}` },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' },
    th: {
      background: palette.cardBg,
      padding: '16px',
      textAlign: 'left',
      fontWeight: '600',
      borderBottom: `2px solid ${palette.cardBorder}`,
      color: palette.text,
      textTransform: 'uppercase',
    },
    td: {
      padding: '14px 16px',
      borderBottom: `1px solid ${palette.cardBorder}`,
      color: palette.textLight,
    },
    actions: { display: 'flex', gap: '8px' },
    btn: {
      padding: '8px 12px',
      border: 'none',
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '0.85rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    btnEdit: { background: palette.primary, color: '#fff' },
    btnDelete: { background: palette.error, color: '#fff' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.controls}>
          <input
            type="text"
            placeholder="🔍 Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select value={filterColumn} onChange={(e) => setFilterColumn(e.target.value)} style={styles.filterSelect}>
            <option value="">Todas las columnas</option>
            {columns.map(col => (
              <option key={col.key} value={col.key}>{col.label}</option>
            ))}
          </select>
          <button onClick={exportToCSV} style={styles.exportBtn} title="Descargar como CSV">
            📥 Exportar
          </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: palette.textLight }}>📭 No hay resultados</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={styles.th}>
                    {col.label}
                  </th>
                ))}
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(row => (
                <tr 
                  key={row.id} 
                  style={{ 
                    background: selectedId === row.id ? palette.inputBg : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={() => setSelectedId(row.id)}
                  onMouseLeave={() => setSelectedId(null)}
                >
                  {columns.map(col => (
                    <td key={`${row.id}-${col.key}`} style={styles.td}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      {onEdit && (
                        <button 
                          style={{ ...styles.btn, ...styles.btnEdit }}
                          onClick={() => onEdit(row)}
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          style={{ ...styles.btn, ...styles.btnDelete }}
                          onClick={() => {
                            setDeleteConfirm({
                              id: row.id,
                              name: row.titulo || row.username || `ID ${row.id}`
                            });
                          }}
                          title="Eliminar"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Modal de confirmación de eliminación */}
          {deleteConfirm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}>
              <div style={{
                backgroundColor: palette?.dark || '#1e293b',
                color: palette?.text || '#e5e7eb',
                padding: '32px',
                borderRadius: '12px',
                textAlign: 'center',
                maxWidth: '400px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
                border: `2px solid ${palette?.error || '#ef4444'}`
              }}>
                <h2 style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: '600' }}>
                  ⚠️ Confirmar eliminación
                </h2>
                <p style={{ marginBottom: '24px', color: palette?.textSecondary || '#cbd5e1', fontSize: '0.95rem' }}>
                  ¿Estás seguro de que quieres eliminar <strong>"{deleteConfirm.name}"</strong>?
                </p>
                <p style={{ marginBottom: '24px', color: palette?.textSecondary || '#cbd5e1', fontSize: '0.85rem' }}>
                  Esta acción no se puede deshacer. Se enviará un email de notificación al usuario.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    onClick={() => {
                      onDelete(deleteConfirm.id);
                      setDeleteConfirm(null);
                    }}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: palette?.error || '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = palette?.errorHover || '#dc2626'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = palette?.error || '#ef4444'}
                  >
                    🗑️ Eliminar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    style={{
                      padding: '10px 24px',
                      backgroundColor: palette?.secondary || '#475569',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = palette?.secondaryHover || '#64748b'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = palette?.secondary || '#475569'}
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '12px', fontSize: '0.9rem', color: palette.textLight }}>
        Mostrando {filteredData.length} de {data.length} registros
      </div>
    </div>
  );
};

export default AdminTable;
