export default async function handler(req, res) {
  const buscarCotacao = async (dataString) => {
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataString}'&$top=1&$format=json`;

    try {
      const response = await fetch(url);
      const text = await response.text();

      // Remove comentário do início da resposta (ex: /* ... */)
      const jsonText = text.replace(/^\/\*.*?\*\//s, '').trim();

      const data = JSON.parse(jsonText);
      if (data.value && data.value.length > 0) {
        return data.value[0].cotacaoVenda;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro buscando cotação:', error);
      return null;
    }
  };

  const buscarCotacaoUltimosDias = async () => {
    const hoje = new Date();
    hoje.setDate(hoje.getDate() - 1); // Começa pela data de ontem

    for (let i = 0; i < 7; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataFormatada = `${(data.getMonth() + 1).toString().padStart(2, '0')}-${data.getDate().toString().padStart(2, '0')}-${data.getFullYear()}`;

      console.log(`Tentando buscar cotação para: ${dataFormatada}`);
      const cotacao = await buscarCotacao(dataFormatada);
      if (cotacao) return cotacao;
    }

    return null;
  };

  const cotacao = await buscarCotacaoUltimosDias();

  if (!cotacao) {
    return res.status(500).send('Não foi possível obter a cotação do dólar.');
  }

  // Redireciona para o formulário do Jotform com a cotação no parâmetro
  const url = `https://form.jotform.com/251176643041047?usd_brl=${cotacao}`;
  return res.redirect(url);
}
