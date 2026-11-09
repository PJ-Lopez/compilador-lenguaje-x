// Programa Mini-C de ejemplo con declaraciones, ciclo y condicional.
export const SAMPLE_CODE = `int a = 2;
int b = 3;
int c = 4;
int t = 2000;
int x = 0;

while (t > 1500) {
    x = a * b / c;
    if (x == 30) {
        a = x;
    } else {
        a = x * a;
    }
    t = t + 1;
}
`
