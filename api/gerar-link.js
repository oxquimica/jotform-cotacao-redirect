export default async function handler(req, res) {
  const { cnpj } = req.query;

  if (!cnpj || cnpj.length !== 14) {
    return res.status(400).send("CNPJ inválido.");
  }

  try {
    // 1. Buscar razão social da empresa
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const data = await response.json();

    if (!data.nome) {
      return res.status(404).send("Razão social não encontrada.");
    }

    const razaoSocial = data.nome;

    // 2. Buscar cotação do dólar
    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      return res.status(500).send("Cotação não encontrada.");
    }

    const cotacaoFormatada = cotacao.toFixed(2);
    const razaoEncoded = encodeURIComponent(razaoSocial);

    // 3. Redirecionar para o Jotform com os dados preenchidos
    const url = `https://form.jotform.com/251176643041047?usd_brl=${cotacaoFormatada}&cnpj=${cnpj}&razaoSocial=${razaoEncoded}`;

    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    console.error("Erro ao gerar link:", error);
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
        return json.value[0].cotacaoVenda;
      }
    } catch (error) {
      console.error("Erro buscando cotação:", error);
    }
  }

  return null;
}

function formatarDataParaURL(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${mes}-${dia}-${ano}`; // Formato MM-DD-YYYY
}
