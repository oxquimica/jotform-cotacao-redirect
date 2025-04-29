export default async function handler(req, res) {
  const fetch = (await import('node-fetch')).default;

  // Função para formatar datas como MM-DD-YYYY
  function formatDate(date) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}-${dd}-${yyyy}`;
  }

  // Começa da data de ontem
  function getYesterdayDate() {
    const today = new Date();
    today.setDate(today.getDate() - 1); // ontem
    return today;
  }

  async function buscarCotacao(date) {
    const dataFormatada = formatDate(date);
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$top=1&$format=json`;

    const response = await fetch(url);
    const text = await response.text();

    try {
      // Remove comentário se houver (algumas respostas vêm com /* ... */)
      const cleaned = text.replace(/^\/\*+|\*+\/$/g, '');
      const json = JSON.parse(cleaned);

      if (json?.value?.length) {
        return json.value[0].cotacaoVenda;
      }
    } catch (error) {
      console.error("Erro parseando JSON:", error);
    }

    return null;
  }

  async function buscarCotacaoUltimosDias() {
    let date = getYesterdayDate(); // Inicia com ontem
    for (let i = 0; i < 7; i++) {
      console.log(`Tentativa ${i + 1}: Buscando cotação para ${formatDate(date)}`);
      const cotacao = await buscarCotacao(date);
      if (cotacao) return cotacao;
      date.setDate(date.getDate() - 1); // retrocede um dia
    }
    return null;
  }

  const cotacao = await buscarCotacaoUltimosDias();
  if (cotacao) {
    const formUrl = `https://form.jotform.com/251176643041047?usd_brl=${cotacao}`;
    res.writeHead(302, { Location: formUrl });
    res.end();
  } else {
    res.status(500).send("Não foi possível obter a cotação do dólar.");
  }
}
