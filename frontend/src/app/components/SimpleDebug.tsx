export default function SimpleDebug() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50px',
        background: 'purple',
        zIndex: 999999,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
      }}
    >
      TOP DEBUG (Server Component)
    </div>
  );
}
