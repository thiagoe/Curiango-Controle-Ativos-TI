async function fetchResumo() {
  const res = await fetch('/api/dashboard/resumo');
  const data = await res.json();
  document.getElementById('cardTotal').textContent = data.total || 0;
  document.getElementById('cardEmUso').textContent = data.em_uso || 0;
  document.getElementById('cardEstoque').textContent = data.em_estoque || 0;
  document.getElementById('cardManutencao').textContent = data.em_manutencao || 0;
  document.getElementById('grafCat').textContent = JSON.stringify(data.por_categoria || {}, null, 2);
  document.getElementById('grafStatus').textContent = JSON.stringify(data.status || {}, null, 2);
}
fetchResumo().catch(console.error);