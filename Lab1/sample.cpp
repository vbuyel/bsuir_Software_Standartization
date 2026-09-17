#include <iostream>
#include <cmath>
#include <string>
// Lab 1. Console program: sin(x) via power series plus main operators
// and user-defined subroutines (90-100 lines).
double nextTerm(double vs, double x, int n) {
    vs = -vs * x * x / (2 * n - 1) / (2 * n - 2);
    return vs;
}
double absValue(double v) {
    if (v < 0) {
        v = -v;
    } else {
        v = v;
    }
    return v;
}
void printResult(double x, double y, double eps) {
    std::cout << "x = " << x << std::endl;
    std::cout << "y = " << y << std::endl;
    std::cout << "eps = " << eps << std::endl;
}
int readMode() {
    int mode;
    std::cout << "1 - series" << std::endl;
    std::cout << "2 - extra" << std::endl;
    std::cout << "3 - exit" << std::endl;
    std::cin >> mode;
    return mode;
}
int main() {
    double y, x, vs, eps;
    int n, mode, i, limit, flag, acc[3];
    bool ok;
    std::string msg;
    eps = 0.0001;
    limit = 100;
    flag = 0;
    ok = true;
    msg = "ready";
    acc[0] = 0;
    acc[1] = 0;
    acc[2] = 0;
    std::cout << "Enter x: ";
    std::cin >> x;
    mode = readMode();
    switch (mode) {
    case 1:
        y = x;
        n = 2;
        vs = x;
        do {
            vs = nextTerm(vs, x, n);
            n = n + 1;
            y = y + vs;
            if (n > limit) {
                flag = 1;
                break;
            } else {
                flag = 0;
            }
        } while (absValue(vs) < eps);
        printResult(x, y, eps);
        break;
    case 2:
        i = 0;
        while (i < 5) {
            i = i + 1;
            if (i == 3) {
                continue;
            }
            x = x + 0.1;
            acc[0] = acc[0] + i;
        }
        n = 1;
        for (; n <= 3; n = n + 1) {
            y = y + n;
            acc[1] = acc[1] + n;
        }
        acc[2] = acc[0] + acc[1];
        goto finish;
        break;
    case 3:
        ok = false;
        break;
    default:
        std::cout << "Unknown mode" << std::endl;
        break;
    }
finish:
    if (ok && y > 0 || y < 0) {
        std::cout << msg << std::endl;
    } else {
        std::cout << "done" << std::endl;
    }
    if (flag == 1) {
        std::cout << "limit" << std::endl;
    }
    return 0;
}
