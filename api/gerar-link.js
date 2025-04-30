export default async function handler(req, res) {
  const { cnpj } = req.query;
  if (!cnpj) {
    return res.status(400).send("CNPJ é obrigatório.");
  }

  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) {
    return res.status(400).send("CNPJ inválido.");
  }

  try {
    const [cotacao, razaoSocial] = await Promise.all([
      buscarCotacaoUltimosDias(10),
      buscarRazaoSocial(cnpjLimpo)
    ]);

    if (!cotacao) {
      return res.status(500).send("Erro ao buscar cotação.");
    }

    const cotacaoFormatada = cotacao.toFixed(2);
    const url = new URL("https://form.jotform.com/251176643041047");
    url.searchParams.set("usd_brl", cotacaoFormatada);
    url.searchParams.set("cnpj", cnpjLimpo);
    url.searchParams.set("razao_social", razaoSocial || "Não encontrada");

    res.writeHead(302, { Location: url.toString() });
    res.end();

  } catch (err) {
    console.error("Erro:", err);
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
  return `${mes}-${dia}-${ano}`;
}

async function buscarRazaoSocial(cnpj) {
  try {
    const res = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const data = await res.json();
    return data.nome || null;
  } catch (err) {
    console.error("Erro ao buscar razão social:", err);
    return null;
  }
}
