export default async function handler(req, res) {
  try {
    const { cnpj, razaoSocial } = req.query;

    if (!cnpj || !razaoSocial) {
      console.warn("Faltando cnpj ou razaoSocial");
      return res.status(400).send("CNPJ e razão social são obrigatórios.");
    }

    if (typeof cnpj !== "string" || cnpj.length !== 14 || !/^\d{14}$/.test(cnpj)) {
      console.warn("CNPJ inválido:", cnpj);
      return res.status(400).send("CNPJ inválido.");
    }

    const razaoSocialDecoded = decodeURIComponent(razaoSocial);

    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      console.error("❌ Cotação do dólar não encontrada");
      return res.status(500).send("Erro ao obter cotação.");
    }

    const cotacaoFormatada = cotacao.toFixed(2);
    const razaoSocialEncoded = encodeURIComponent(razaoSocialDecoded);

    const url = `https://form.jotform.com/251176643041047?usd_brl=${cotacaoFormatada}&cnpj=${cnpj}&razaoSocial=${razaoSocialEncoded}`;
    console.log("🔗 Redirecionando para:", url);

    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    console.error("🔥 Erro inesperado no handler gerar-link:", error);
    res.status(500).send("Erro interno no servidor.");
  }
}

// 🔽 Função para buscar cotação do dólar dos últimos dias
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
        console.log(`✅ Cotação encontrada para ${dataFormatada}:`, json.value[0].cotacaoVenda);
        return json.value[0].cotacaoVenda;
      }
    } catch (error) {
      console.warn(`⚠️ Erro buscando cotação para ${dataFormatada}:`, error);
    }
  }

  return null;
}

// 🔽 Formata a data para o formato MM-DD-YYYY exigido pelo Banco Central
function formatarDataParaURL(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${mes}-${dia}-${ano}`;
}
