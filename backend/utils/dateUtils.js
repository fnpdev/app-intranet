function getLastDayOfMonth(competencia) {
    if (!competencia) return null;

    const ano = Number(competencia.substring(0, 4));
    const mes = Number(competencia.substring(4, 6));

    // truque: dia 0 do próximo mês = último dia do mês atual
    const lastDate = new Date(ano, mes, 0);

    const yyyy = lastDate.getFullYear();
    const mm = String(lastDate.getMonth() + 1).padStart(2, '0');
    const dd = String(lastDate.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
}

module.exports = { getLastDayOfMonth };
