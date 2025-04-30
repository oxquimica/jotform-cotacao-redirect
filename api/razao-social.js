export default async function handler(req, res) {
  const { cnpj } = req.query;

  if (!cnpj  cnpj.length !== 14) {
    return res.status(400).json({ erro CNPJ inválido });
  }

  try {
    const response = await fetch(`httpswww.receitaws.com.brv1cnpj${cnpj}`);
    const data = await response.json();

    if (data.nome) {
      res.status(200).json({ razaoSocial data.nome });
    } else {
      res.status(404).json({ erro Razão social não encontrada. });
    }
  } catch (error) {
    res.status(500).json({ erro Erro ao buscar razão social. });
  }
}
