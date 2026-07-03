export const maskCpfCnpj = (value: string) => {
  let v = value.replace(/\D/g, "");
  
  if (v.length <= 11) { // CPF
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else { // CNPJ
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    if (v.length > 18) v = v.substring(0, 18);
  }
  return v;
};

export const maskTelefone = (value: string) => {
  let v = value.replace(/\D/g, "");
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  if (v.length > 15) v = v.substring(0, 15);
  return v;
};

export const maskPlaca = (value: string) => {
  let v = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  if (v.length > 3) {
    // Mercosul (ABC1D23) ou Antiga (ABC-1234)
    // Vamos apenas colocar o hifen para o padrão antigo se o usuário estiver digitando
    // A placa real sempre tem 7 caracteres.
    v = v.substring(0, 7);
    const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(v);
    const isAntiga = /^[A-Z]{3}[0-9]{4}$/.test(v);

    // Formatar visualmente como ABC-1234 para o padrao antigo
    // Ou apenas manter como ABC1D23 para o mercosul
    if (v.length === 7) {
      if (isAntiga) {
        return v.replace(/^([A-Z]{3})([0-9]{4})$/, "$1-$2");
      }
    } else {
      // Enquanto digita, adicionamos o hifen
      if (/^[A-Z]{3}[0-9]/.test(v)) {
        // não sabemos se é mercosul ou não, mas se for antigo, o 5º caracter é numero
        const part1 = v.substring(0,3);
        const part2 = v.substring(3);
        return `${part1}-${part2}`;
      }
    }
  }
  return v;
};

export const maskCurrency = (value: string | number) => {
  let v = String(value).replace(/\D/g, "");
  if (!v) return "R$ 0,00";
  const options = { minimumFractionDigits: 2 };
  const result = new Intl.NumberFormat('pt-BR', options).format(
    parseFloat(v) / 100
  );
  return "R$ " + result;
};

// Converte a string mascarada R$ 1.500,00 para float 1500.00
export const unmaskCurrency = (value: string) => {
  if (!value) return 0;
  const v = value.replace(/\D/g, "");
  return parseFloat(v) / 100;
};
