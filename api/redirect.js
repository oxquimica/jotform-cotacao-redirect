export default async function handler(req, res) {
  try {
    const cotacao = await buscarCotacaoUltimosDias(10); // Busca retroativa até 10 dias
    if (!cotacao) {
      res.status(500).send("Cotação não encontrada.");
      return;
    }

    const cotacaoFormatada = cotacao.toFixed(2); // Arredonda para 2 casas decimais

    res.writeHead(302, {
      Location: `https://form.jotform.com/251176643041047?usd_brl=${cotacaoFormatada}`
    });
    res.end();
  } catch (error) {
    console.error("Erro no handler:", error);
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
    console.log(`Buscando cotação para a data: ${dataFormatada}`);

    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$top=1&$format=json`;

    try {
      const response = await fetch(url);
      const text = await response.text();

      // Remove comentários que o Banco Central inclui no JSON
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
  const mes = String(data.getMonth() + 1).padStart(2, '0'); // Janeiro = 0
  const ano = data.getFullYear();
  return `${mes}-${dia}-${ano}`; // Formato MM-DD-YYYY
}
