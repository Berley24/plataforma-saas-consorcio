// Fundo com bolhas de luz desfocadas (vermelho, laranja, índigo) + granulado sutil.
export default function Blobs() {
  return (
    <>
      <div className="bg-blobs" aria-hidden="true">
        <div className="blob b1" />
        <div className="blob b2" />
        <div className="blob b3" />
        <div className="blob b4" />
      </div>
      <div className="bg-grain" aria-hidden="true" />
    </>
  );
}
