#include <iostream>

// Lab 2. Sample for Gilb metrics: all C++ loop operators and branching
// (if/else, switch with default, switch without default, nested for+if).
int main() {
    int n = 5;
    int sum = 0;
    int mode = 1;
    int i = 0;
    int j = 0;
    int k = 0;
    int t = 0;

    while (i < n) {
        sum = sum + i;
        i = i + 1;
    }

    for (j = 0; j < n; j = j + 1) {
        if (j % 2 == 0) {
            sum = sum + j;
        } else {
            sum = sum - j;
        }
    }

    do {
        k = k + 1;
    } while (k < 3);

    if (mode > 0) {
        switch (mode) {
        case 1:
            sum = sum + 10;
            break;
        case 2:
            sum = sum + 20;
            break;
        default:
            sum = 0;
            break;
        }
    }

    while (t < 2) {
        switch (t) {
        case 0:
            sum = sum + 1;
            break;
        case 1:
            sum = sum + 2;
            break;
        }
        t = t + 1;
    }

    std::cout << sum << std::endl;
    return 0;
}
