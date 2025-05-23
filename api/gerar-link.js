import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { cnpj, razaoSocial } = req.query;

    if (!cnpj) {
      res.status(400).send("CNPJ obrigatório.");
      return;
    }

    let nomeEmpresa = razaoSocial;

    // Se não veio razão social, busca via API externa
    if (!nomeEmpresa) {
      const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
      const data = await response.json();

      if (!data.nome) {
        res.status(404).send("Razão social não encontrada.");
        return;
      }
      nomeEmpresa = data.nome;
    }

    // Busca cotação do dólar (exemplo, adapte conforme sua API)
    const cotacaoResponse = await fetch(
      "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/10?formato=json"
    );
    const cotacaoData = await cotacaoResponse.json();

    if (!cotacaoData || cotacaoData.length === 0) {
      res.status(500).send("Erro ao buscar cotação do dólar.");
      return;
    }

    const ultimaCotacao = cotacaoData[cotacaoData.length - 1].valor;
    const cotacaoFormatada = ultimaCotacao.toFixed(2);

    // Monta a URL do formulário com parâmetros
    const url = `https://form.jotform.com/251176643041047?cnpj=${encodeURIComponent(
      cnpj
    )}&razaoSocial=${encodeURIComponent(nomeEmpresa)}&usd_brl=${cotacaoFormatada}`;

    // Redireciona para o formulário
    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    console.error("Erro na API gerar-link:", error);
    res.status(500).send("Erro interno no servidor.");
  }
}
