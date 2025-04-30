export default async function handler(req, res) {
  const { cnpj } = req.query;

  if (!cnpj || cnpj.length !== 14) {
    return res.status(400).json({ error: "CNPJ inválido" });
  }

  try {
    const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    const data = await response.json();

    if (data.nome) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(200).json({ nome: data.nome });
    } else {
      return res.status(404).json({ error: "Razão social não encontrada" });
    }
  } catch (error) {
    return res.status(500).json({ error: "Erro ao consultar a ReceitaWS" });
  }
}
