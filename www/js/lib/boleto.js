 /**
 * https://jsfiddle.net/3bcz5jav/5/
 */
var Boleto = {
    barcodeNumber: '',
    bankSlipNumber: '', // bankSlipNumber
    errors: [],

    setBarcode: function (number) {
        number = number.toString();

        this.barcodeNumber = number;
        if (!this.barcodeIsValid(number)) {
            throw new Error('Invalid bank slip barcode');
        }
        this.bankSlipNumber = this.toBankSlipNumber(number);
    },
    setSlipNumber: function (str) {
        str = str.replace(/[^\d]/g, '');
        str = str.toString();


        if (!this.slipIsValid(str)) {
            throw new Error('Invalid bank slip number');
        }
        this.bankSlipNumber = str;
        this.barcodeNumber = this.barcode(str);
    },

    number: function () {
        return this.bankSlipNumber;
    },
    prettyNumber: function () {
        const number = this.bankSlipNumber;

        return number.replace(
            /^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d{1})(\d{14})$/,
            '$1.$2 $3.$4 $5.$6 $7 $8',
        );
    },
    /**
     * https://portal.febraban.org.br/pagina/3166/33/pt-br/layour-arrecadacao
     */
    barcode: function (str = null) {
        let bankSlipNumber = (str != null) ? str : this.bankSlipNumber;

        return bankSlipNumber.replace(
            /^(\d{4})(\d{5})\d{1}(\d{10})\d{1}(\d{10})\d{1}(\d{15})$/,
            '$1$5$2$3$4',
        );
    },
    checksum: function () {
        return this.barcode()[4];
    },
    amount: function () {
        return (this.barcode().substr(9, 10) / 100.0).toFixed(2);
    },
    prettyAmount() {
        const currency = this.currency();

        if (currency === 'Unknown') {
            return this.amount();
        }
        return `${currency.symbol} ${this.amount().replace('.', currency.decimal)}`;
    },
    bank: function () {
        switch (this.barcode().substr(0, 3)) {
            case '001':
                return 'Banco do Brasil';
            case '007':
                return 'BNDES';
            case '033':
                return 'Santander';
            case '069':
                return 'Crefisa';
            case '077':
                return 'Banco Inter';
            case '102':
                return 'XP Investimentos';
            case '104':
                return 'Caixa Econômica Federal';
            case '140':
                return 'Easynvest';
            case '197':
                return 'Stone';
            case '208':
                return 'BTG Pactual';
            case '212':
                return 'Banco Original';
            case '237':
                return 'Bradesco';
            case '260':
                return 'Nu Pagamentos';
            case '341':
                return 'Itaú';
            case '389':
                return 'Banco Mercantil do Brasil';
            case '422':
                return 'Banco Safra';
            case '505':
                return 'Credit Suisse';
            case '633':
                return 'Banco Rendimento';
            case '652':
                return 'Itaú Unibanco';
            case '735':
                return 'Banco Neon';
            case '739':
                return 'Banco Cetelem';
            case '745':
                return 'Citibank';
            default:
                return 'Unknown';
        }
    },
    currency: function () {
        switch (this.barcode()[3]) {
            case '9':
                return { code: 'BRL', symbol: 'R$', decimal: ',' };
            default:
                return 'Unknown';
        }
    },
    expirationDate: function (format = "YYYY-MM-DD") {
        const refDate = new Date('1997-10-07');
        const days = this.barcode().substr(5, 4);

        var expire = new Date(refDate.getTime() + (days * 86400000));
        return moment(expire).format(format);
    },

    toBarcodeNumber: function (bankSlipNumber) {
        let code = bankSlipNumber.replace(/[^0-9]/g, '');

        // CÁLCULO DO DÍGITO DE AUTO CONFERÊNCIA (DAC)   -   5ª POSIÇÃO
        if (code.length < 47) {
            code = code + '00000000000'.substr(0, 47 - code.length);
        }
        if (code.length != 47) {
            this.errors.push('A linha do código de barras está incompleta!' + code.length);
            return false;
        }

        code = code.substr(0, 4) + code.substr(32, 15) + code.substr(4, 5) + code.substr(10, 10) + code.substr(21, 10);

        if (this.modulo11(code.substr(0, 4) + code.substr(5, 39)) != code.substr(4, 1)) {
            throw new Error('Digito verificador ' + code.substr(4, 1) + ', o correto é ' + this.modulo11(code.substr(0, 4) + code.substr(5, 39)) + '\nO sistema não altera automaticamente o dígito correto na quinta casa!');
        }

        this.barcodeNumber = code;
        return code;
    },
    toBankSlipNumber: function (barcodeNumber) {
        let number = barcodeNumber.replace(/[^0-9]/g, '');

        if (number.length != 44) {
            throw new Error('A linha do código de barras está incompleta!');
        }
        if (!this.barcodeIsValid(number)) {
            throw new Error('A linha do código de barras está incorreto!');
        }

        let campo1 = number.substr(0, 4) + number.substr(19, 1) + number.substr(20, 4);
        let campo2 = number.substr(24, 5) + number.substr(24 + 5, 5);
        let campo3 = number.substr(34, 5) + number.substr(34 + 5, 5);
        let campo4 = number.substr(4, 1); // Digito verificador
        let campo5 = number.substr(5, 14); // Vencimento + Valor

        if (campo5 == 0) {
            campo5 = '000';
        }
        number = campo1 + this.modulo10(campo1) + campo2 + this.modulo10(campo2) + campo3 + this.modulo10(campo3) + campo4 + campo5;

        this.bankSlipNumber = number;
        return number;
    },
    /**
     * Calculates the modulo 10 checksum digit
     *
     * The specifications of the algorithm can be found at
     * https://portal.febraban.org.br/pagina/3166/33/pt-br/layour-arrecadacao
     *
     * @params {Array|String} number
     * @return {Integer} The modulo 11 checksum digit
     *
     * @example
     * modulo10('123456789'); // Returns 9
     */
    modulo10: function (number) {

        number = number.replace(/[^0-9]/g, '');
        let soma = 0;
        let peso = 2;
        let contador = number.length - 1;
        while (contador >= 0) {
            multiplicacao = (number.substr(contador, 1) * peso);
            if (multiplicacao >= 10) {
                multiplicacao = 1 + (multiplicacao - 10);
            }
            soma = soma + multiplicacao;
            if (peso == 2) {
                peso = 1;
            } else {
                peso = 2;
            }
            contador = contador - 1;
        }
        let digito = 10 - (soma % 10);
        if (digito == 10) digito = 0;

        return digito;
    },
    /**
     * Calculates the modulo 11 checksum digit
     *
     * The specifications of the algorithm can be found at
     * https://portal.febraban.org.br/pagina/3166/33/pt-br/layour-arrecadacao
     *
     * @params {Array|String} number
     * @return {Integer} The modulo 11 checksum digit
     *
     * @example
     * modulo11('123456789');  // Returns 7
     */
    modulo11: function (number) {
        let digits = number;

        if (typeof digits === 'string') {
            digits = digits.split('');
        }
        digits.reverse();
        let sum = 0;
        for (let i = 0; i < digits.length; i += 1) {
            sum += ((i % 8) + 2) * digits[i];
        }

        return (11 - (sum % 11)) % 10 || 1;
    },
    /**
     * Validates whether the bank slip number is valid or not
     *
     * The validation function ensures that the bank slip number is exactly 47
     * characters long, then applies the modulo-11 algorithm to the bank slip's
     * barcode. Finally, it verifies that the result of the algorithm equals the
     * checksum digit from the bank slip number.
     *
     * @return {Boolean} Whether the bank slip number is valid or not
     */
    slipIsValid(str = null) {
        let slipNumber = (str != null) ? str : this.bankSlipNumber;

        if (slipNumber.length !== 47) {
            return false;
        }

        let barcodeDigits = this.barcode(slipNumber).split('');
        let checksum = barcodeDigits.splice(4, 1);

        return (this.modulo11(barcodeDigits).toString() === checksum.toString());
    },
    /**
     * Validates whether the barcode is valid or not
     *
     * The validation function ensures that the bank slip barcode
     * has the correct check digit
     * 34195844100000020005000001233203186422147000
     * 3419 5 844100000020005000001233203186422147000 (check digit is 5)
     *
     * @param {string|int} code barcode number to validate
     * @return {Boolean} Whether the bank slip number is valid or not
     */
    barcodeIsValid(code = null) {
        // Substituindo digito por zero, para evitar erros
        const barcode = (code != null) ? code : this.barcodeNumber;
        let clean_barcode = this.substr_replace(barcode.toString(), "0", 4, 1);
        let barras_arr = clean_barcode.split('');

        //Vetor de fatores
        const fatores = [4, 3, 2, 9, 0, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let soma = 0;
        //Multiplicando e somando
        for (let i = 0, j = fatores.length; i < j; i++) {
            soma += barras_arr[i] * fatores[i];
        }
        let mod = soma % 11; //Pegando resto da divisão
        let codVerificador = 11 - mod;
        // subsistuir o zero no limpo e comparar
        let barcode_compare = this.substr_replace(clean_barcode, codVerificador.toString(), 4, 1);

        if (barcode.toString() === barcode_compare.toString()) {
            return true;
        }
        return false;
    },
    pad10: function (number) {
        if (number < 10) {
            number = "0" + number;
        }
        return number;
    },
    /**
     * PHP's substr_replace in JavaScript
     * 
     * https://www.php.net/manual/en/function.substr-replace.php
     * 
     * discuss at: http://locutus.io/php/substr_replace/
     * @example
     * substr_replace ( mixed $string , mixed $replacement , mixed $start [, mixed $length ] ) : mixed
     * discuss at: http://locutus.io/php/substr_replace/
     * original by: Brett Zamir (http://brett-zamir.me)
     * example 1: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', 0)
     * returns 1: 'bob'
     * example 2: var $var = 'ABCDEFGH:/MNRPQR/'
     * example 2: substr_replace($var, 'bob', 0, $var.length)
     * returns 2: 'bob'
     * example 3: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', 0, 0)
     * returns 3: 'bobABCDEFGH:/MNRPQR/'
     * example 4: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', 10, -1)
     * returns 4: 'ABCDEFGH:/bob/'
     * example 5: substr_replace('ABCDEFGH:/MNRPQR/', 'bob', -7, -1)
     * returns 5: 'ABCDEFGH:/bob/'
     * example 6: substr_replace('ABCDEFGH:/MNRPQR/', '', 10, -1)
     * returns 6: 'ABCDEFGH://'
     * @param {string} str The input string. 
     * @param {string} replace  The replacement string. 
     * @param {int} start 
     *              If start is non-negative, the replacing will begin at the start'th offset into string. 
     *              If start is negative, the replacing will begin at the start'th character from the end of string. 
     * @param {ing} length
     * If given and is positive, it represents the length of the portion of string which is to be replaced. If it is negative,
     * it represents the number of characters from the end of string at which to stop replacing. If it is not given, then it 
     * will default to strlen( string ); i.e. end the replacing at the end of string. Of course, if length is zero then this 
     * function will have the effect of inserting replacement into string at the given start offset. 
     */

    substr_replace: function (str, replace, start, length) {

        if (start < 0) {
            // start position in str
            start = start + str.length
        }
        length = length !== undefined ? length : str.length
        if (length < 0) {
            length = length + str.length - start
        }

        return [
            str.slice(0, start),
            replace.substr(0, length),
            replace.slice(length),
            str.slice(start + length)
        ].join('')
    }

}
// #######################################################################
// var a = "34195844100000020005000001233203186422147000";
// var b = "34195.00008 01233.203189 64221.470004 5 84410000002000";

// //Boleto.setBarcode(a);
// Boleto.setSlipNumber(b);

// $("#number").html(Boleto.number());
// $("#prettyNumber").html(Boleto.prettyNumber());
// $("#barcode").html(Boleto.barcode());
// $("#checksum").html(Boleto.checksum());
// $("#amount").html(Boleto.amount());
// $("#bank").html(Boleto.bank());
// $("#currency").html( JSON.stringify(Boleto.currency()) );
// $("#expirationDate").html(Boleto.expirationDate('d/m/Y H:i:s'));

// if (Boleto.barcodeIsValid(a)) {
//     console.log('valid');
// } else {
//     console.log('invalid');
// }