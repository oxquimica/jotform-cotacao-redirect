export default async function handler(req, res) {
  console.log('Iniciando handler...');

  const formId = '251176643041047';
  const fieldName = 'usd_brl';

  async function buscarCotacao(data) {
    const dataFormatada = ("0" + (data.getMonth() + 1)).slice(-2) + "-" + 
                          ("0" + data.getDate()).slice(-2) + "-" + 
                          data.getFullYear();
    console.log(`Buscando cotação para a data: ${dataFormatada}`);

    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$top=1&$format=json`;

    try {
      const response = await fetch(url);
      console.log('Resposta recebida da API do Banco Central.');

      const text = await response.text();
      console.log('Texto da resposta:', text.substring(0, 200)); // Mostra só o começo, para não lotar log

      const cleanedText = text
        .replace(/^\/\*\s*/, '')  
        .replace(/\s*\*\/$/, '');

      const json = JSON.parse(cleanedText);
      console.log('JSON parseado:', json);

      if (json.value && json.value.length > 0) {
        console.log('Cotação encontrada:', json.value[0].cotacaoVenda);
        return json.value[0].cotacaoVenda.toFixed(2);
      } else {
        console.warn('Nenhuma cotação encontrada.');
        return null;
      }
    } catch (error) {
      console.error('Erro buscando cotação:', error);
      return null;
    }
  }

  async function buscarCotacaoUltimosDias() {
    console.log('Tentando buscar cotação retroativa...');
    let hoje = new Date();
    for (let i = 0; i < 7; i++) {
      console.log(`Tentativa ${i+1}:`);
      const cotacao = await buscarCotacao(hoje);
      if (cotacao) {
        console.log(`Cotação obtida no ${i+1}º dia retroativo.`);
        return cotacao;
      }
      hoje.setDate(hoje.getDate() - 1);
    }
    console.error('Não foi possível encontrar cotação nos últimos 7 dias.');
    return null;
  }

  try {
    const cotacao = await buscarCotacaoUltimosDias();

    if (!cotacao) {
      return res.status(500).send('Não foi possível obter a cotação.');
    }

    const redirectUrl = `https://form.jotform.com/${formId}?${fieldName}=${cotacao}`;
    console.log('Redirecionando para:', redirectUrl);
    res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('Erro inesperado no handler:', err);
    res.status(500).send('Erro interno no servidor.');
  }
}
