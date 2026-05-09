export function validatePaymentBody(req, res, next) {
  const { turnoId, precio, email, nombre } = req.body;
  const errors = [];

  if (!turnoId || typeof turnoId !== 'string')
    errors.push('turnoId requerido');
  if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0)
    errors.push('precio debe ser un número mayor a 0');
  if (!email || !email.includes('@'))
    errors.push('email inválido');
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2)
    errors.push('nombre requerido');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}
