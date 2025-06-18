export default async function handler(req, res) {
  try {
    const { cnpj, razaoSocial, alt } = req.query;

    if (!cnpj || !razaoSocial) {
      return res.status(400).send("CNPJ e razão social são obrigatórios.");
    }
    if (typeof cnpj !== "string" || cnpj.length !== 14 || !/^\d{14}$/.test(cnpj)) {
      return res.status(400).send("CNPJ inválido.");
    }

    const razaoSocialDecoded = decodeURIComponent(razaoSocial);
    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      return res.status(500).send("Erro ao obter cotação.");
    }

    const cotacaoFormatada = cotacao.toFixed(2);
    const razaoSocialEncoded = encodeURIComponent(razaoSocialDecoded);

    // Lógica de seleção de formulário:
    const hoje = new Date();
    const dia = hoje.getDate();

    const formularioPadrao = (dia <= 14) ? '251176643041047' : '251684725505663';
    const formularioAlternativo = (dia <= 14) ? '251684725505663' : '251176643041047';
    const formId = (alt === '1') ? formularioAlternativo : formularioPadrao;

    const url = `https://form.jotform.com/${formId}?usd_brl=${cotacaoFormatada}&cnpj=${cnpj}&razaoSocial=${razaoSocialEncoded}`;
    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    res.status(500).send("Erro interno no servidor.");
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
