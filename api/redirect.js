export default async function handler(req, res) {
  try {
    const { alt } = req.query;
    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      res.status(500).send("Cotação não encontrada.");
      return;
    }

    const cotacaoFormatada = cotacao.toFixed(2);

    const hoje = new Date();
    const dia = hoje.getDate();
    const formularioPadrao = (dia <= 14) ? '251176643041047' : '251684725505663';
    const formularioAlternativo = (dia <= 14) ? '251684725505663' : '251176643041047';
    const formId = (alt === '1') ? formularioAlternativo : formularioPadrao;

    res.writeHead(302, {
      Location: `https://form.jotform.com/${formId}?usd_brl=${cotacaoFormatada}`
    });
    res.end();
  } catch (error) {
    res.status(500).send("Erro interno.");
  }
}

async function buscarCotacaoUltimosDias(diasMaximos) {
  const hoje = new Date();
  hoje.setDate(hoje.getDate() - 1);
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
    } catch {}
  }
  return null;
}

function formatarDataParaURL(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${mes}-${dia}-${ano}`;
}
