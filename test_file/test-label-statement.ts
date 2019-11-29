const global_1 = 3;
const labelled3 = 4;
function testLabelStatement() {
  labelled1: const local_1 = 2;
  const labelled2 = 1;
  labelled2: {
    labelled3: {
      for (let i = 3; i < 4; i++) {
        if (i === 3) {
          break labelled3;
        }
        const local_2 = labelled2;
        const local_3 = labelled3;
      }
    }
  }
}
