export default async function handler(req, res) {
  try {
    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      return res.status(500).json({ error: "Erro ao obter cotação." });
    }

    res.status(200).json({ cotacao });
  } catch (error) {
    console.error("Erro na API de cotação:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
}

async function buscarCotacaoUltimosDias(diasMaximos) {
  const hoje = new Date();
  hoje.setDate(hoje.getDate() - 1); // Começa por ontem

  for (let i = 0; i < diasMaximos; i++) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    const dataFormatada = formatarDataParaURL(data);

    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$top=1&$format=json`;

    try {
      const response = await fetch(url);
      const text = await response.text();
      const jsonText = text.replace(/^\/\*+[\s\S]*?\*+\//, "").trim();
      const json = JSON.parse(jsonText);

      if (json.value && json.value.length > 0) {
        return json.value[0].cotacaoVenda;
      }
    } catch (error) {
      console.warn(`Erro buscando cotação para ${dataFormatada}:`, error);
    }
  }

  return null;
}

function formatarDataParaURL(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${mes}-${dia}-${ano}`;
}
