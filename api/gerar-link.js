export default async function handler(req, res) {
  const { cnpj } = req.query;

  if (!cnpj) {
    res.status(400).send("CNPJ é obrigatório.");
    return;
  }

  try {
    // Busca razão social
    const resposta = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const dados = await resposta.json();
    const razao = encodeURIComponent(dados.nome || "");

    // Busca cotação do dólar
    const cotacao = await buscarCotacaoUltimosDias(10);
    const cotacaoFormatada = cotacao ? cotacao.toFixed(2) : "";

    // Monta URL com todos os campos do Jotform
    const url = `https://form.jotform.com/251176643041047?cnpj=${cnpj}&razaoSocial=${razao}&usd_brl=${cotacaoFormatada}`;

    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).send("Erro ao processar a requisição.");
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
    } catch (e) {
      console.error("Erro buscando cotação:", e);
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
