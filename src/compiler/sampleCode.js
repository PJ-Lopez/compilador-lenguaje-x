export const SAMPLE_CODE = `int edad;
float promedio;
int contador;
int total = 0;

edad = 20;
promedio = 8.5;
contador = 0;

total = total + edad * 2 - 4;

while (contador < 5) {
  contador = contador + 1;
  print(contador);
}

if (promedio >= 8) {
  print(1);
} else {
  print(0);
}

if (edad == 20) {
  print(total);
}
`
