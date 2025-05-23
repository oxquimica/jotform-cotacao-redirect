export default async function handler(req, res) {
  try {
    const { cnpj } = req.query;
    console.log("🔍 CNPJ recebido:", cnpj);

    if (!cnpj) {
      console.warn("⚠️ Nenhum CNPJ fornecido");
      return res.status(400).send("CNPJ é obrigatório.");
    }

    // Consulta a razão social na ReceitaWS
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const data = await response.json();
    console.log("📦 Dados da ReceitaWS:", data);

    if (!data.nome) {
      console.warn("❌ Razão social não encontrada para o CNPJ:", cnpj);
      return res.status(404).send("Razão social não encontrada.");
    }

    const razaoSocial = encodeURIComponent(data.nome);

    // Busca cotação do dólar
    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      console.error("❌ Cotação do dólar não encontrada");
      return res.status(500).send("Erro ao obter cotação.");
    }

    const cotacaoFormatada = cotacao.toFixed(2);
    console.log("💵 Cotação formatada:", cotacaoFormatada);

    // Monta o link do formulário com os dados
    const url = `https://form.jotform.com/251176643041047?usd_brl=${cotacaoFormatada}&cnpj=${cnpj}&razaoSocial=${razaoSocial}`;
    console.log("🔗 Redirecionando para:", url);

    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    console.error("🔥 Erro inesperado no handler gerar-link:", error);
    res.status(500).send("Erro interno no servidor.");
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
        console.log(`✅ Cotação encontrada para ${dataFormatada}:`, json.value[0].cotacaoVenda);
        return json.value[0].cotacaoVenda;
      }
    } catch (error) {
      console.warn(`⚠️ Erro buscando cotação para ${dataFormatada}:`, error);
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
