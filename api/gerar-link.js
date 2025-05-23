export default async function handler(req, res) {
  try {
    const { cnpj, razaoSocial } = req.query;

    if (!cnpj || !razaoSocial) {
      return res.status(400).send("CNPJ e razão social são obrigatórios.");
    }

    // Busca cotação do dólar
    const cotacao = await buscarCotacaoUltimosDias(10);
    if (!cotacao) {
      console.error("❌ Cotação do dólar não encontrada");
      return res.status(500).send("Erro ao obter cotação.");
    }

    const cotacaoFormatada = cotacao.toFixed(2);
    const razaoSocialEncoded = encodeURIComponent(razaoSocial);

    // Monta o link do formulário com os dados
    const url = `https://form.jotform.com/251176643041047?usd_brl=${cotacaoFormatada}&cnpj=${cnpj}&razaoSocial=${razaoSocialEncoded}`;
    console.log("🔗 Redirecionando para:", url);

    res.writeHead(302, { Location: url });
    res.end();
  } catch (error) {
    console.error("🔥 Erro inesperado no handler gerar-link:", error);
    res.status(500).send("Erro interno no servidor.");
  }
}

// Funções buscarCotacaoUltimosDias e formatarDataParaURL permanecem iguais
