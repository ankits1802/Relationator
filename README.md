# 🔗 Relationator

**A Comprehensive Toolkit for Relational Database Theory and Operations**

Relationator is a comprehensive toolkit designed for database professionals, students, and researchers working with relational database theory. This project provides a complete suite of tools for handling **functional dependencies**, **relational algebra operations**, **decomposition checks**, and **natural language to SQL query conversions**.

---

## ✨ Key Features

### 🔧 Core Functionalities

| Feature                         | Description                                     | Mathematical Foundation                       |
| ------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| **Functional Dependencies**     | Analyze and validate FDs in relational schemas  | $X \rightarrow Y$                             |
| **Relational Algebra**          | Perform complete set of relational operations   | $\sigma, \pi, \cup, \cap, -, \times, \bowtie$ |
| **Decomposition Analysis**      | Check lossless join and dependency preservation | $R = R_1 \bowtie R_2 \bowtie ... \bowtie R_n$ |
| **Natural Language Processing** | Convert English queries to SQL statements       | Advanced NLP algorithms                       |

### 🎯 Specialized Operations

**Relational Algebra Operations**:

* **Selection** ($\sigma$): Filter tuples based on conditions
* **Projection** ($\pi$): Select specific attributes
* **Union** ($\cup$): Combine compatible relations
* **Intersection** ($\cap$): Find common tuples
* **Difference** ($-$): Remove tuples present in second relation
* **Cartesian Product** ($\times$): Generate all possible combinations
* **Join** ($\bowtie$): Combine relations based on common attributes
* **Division** ($\div$): Find tuples in first relation associated with all tuples in second

---

## 🏗️ Architecture

### **Functional Dependencies Module**

The system handles functional dependencies using the formal definition:

$$
\text{For } X \rightarrow Y \text{ in relation } R: \forall t_1, t_2 \in r(R), \text{ if } t_1[X] = t_2[X] \text{ then } t_1[Y] = t_2[Y]
$$

**Key Properties**:

* **Reflexivity**: If $Y \subseteq X$, then $X \rightarrow Y$
* **Augmentation**: If $X \rightarrow Y$, then $XZ \rightarrow YZ$
* **Transitivity**: If $X \rightarrow Y$ and $Y \rightarrow Z$, then $X \rightarrow Z$

### **Decomposition Analysis Engine**

The toolkit implements advanced algorithms to check two critical properties:

#### 1. **Lossless Join Property**

Ensures that decomposition doesn't lose information:

$$
R = \pi_{R_1}(R) \bowtie \pi_{R_2}(R) \bowtie ... \bowtie \pi_{R_n}(R)
$$

#### 2. **Dependency Preservation Property**

Verifies that all functional dependencies are preserved across decomposed relations:

$$
F^+ = (F_1 \cup F_2 \cup ... \cup F_n)^+
$$

---

## 🚀 Getting Started

### Prerequisites

* **Programming Language**: Python (based on repo structure)
* **Database Knowledge**: Understanding of relational database theory
* **Mathematical Background**: Familiarity with set theory and logic

### Installation

```bash
git clone https://github.com/ankits1802/Relationator.git
cd Relationator
# Follow specific installation instructions in the repository
```

---

## 📊 Usage Examples

### **Functional Dependency Analysis**

```sql
-- Example relation R(A, B, C, D)
-- Functional Dependencies: A → B, B → C, C → D
-- Check if A → D (transitive closure)
```

### **Decomposition Verification**

| Original Relation | Decomposed Relations      | Lossless? | Dependency Preserving? |
| ----------------- | ------------------------- | --------- | ---------------------- |
| R(A,B,C,D)        | R1(A,B), R2(B,C), R3(C,D) | ✅ Yes     | ✅ Yes                  |
| R(A,B,C)          | R1(A,B), R2(A,C)          | ❌ No      | ✅ Yes                  |

### **Natural Language to SQL**

```
Input: "Find all customers who have both savings and checking accounts"
Output:
SELECT DISTINCT customer_name 
FROM account 
WHERE account_type = 'savings' 
AND customer_name IN (
    SELECT customer_name 
    FROM account 
    WHERE account_type = 'checking'
);
```

---

## 🔬 Advanced Features

### **Normalization Analysis**

Supports checks for:

* **1NF**: Atomic values only
* **2NF**: 1NF + No partial dependencies
* **3NF**: 2NF + No transitive dependencies
* **BCNF**: 3NF + Every determinant is a candidate key

BCNF Formalization:

$$
\forall X \rightarrow Y \in F^+, \text{ either } Y \subseteq X \text{ or } X \text{ is a superkey of } R
$$

### **Multivalued Dependencies**

Handles complex constraints like:

$$
X \twoheadrightarrow Y \mid Z
$$

Meaning Y and Z are independent given X.

---

## 🎓 Educational Applications

### **Learning Modules**

| Module                 | Topics Covered                  | Complexity      |
| ---------------------- | ------------------------------- | --------------- |
| **Basics**             | Relations, Attributes, Tuples   | 🟢 Beginner     |
| **Dependencies**       | FDs, MVDs, Join Dependencies    | 🟡 Intermediate |
| **Normalization**      | 1NF through BCNF, 4NF, 5NF      | 🟠 Advanced     |
| **Query Optimization** | Relational Algebra Equivalences | 🔴 Expert       |

### **Practice Problems**

* Closure computation
* Minimal cover generation
* Decomposition algorithms (3NF/BCNF)
* Relational algebra optimization

---

## 🤝 Contributing

We welcome contributions! 🎉

### Steps:

1. **Fork** the repository
2. **Create** a feature branch
3. **Implement** changes with documentation
4. **Add** test cases
5. **Submit** a PR

```bash
git clone https://github.com/yourusername/Relationator.git
cd Relationator
git checkout -b feature/your-feature-name
# Make changes
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
```

---

## 📚 Documentation

### **API Reference**

Located in `/docs`:

* Function signatures and params
* Return types and errors
* Usage examples
* Performance notes

### **Mathematical Foundations**

Implements:

**Armstrong's Axioms**:

$$
\begin{align}
\text{Reflexivity: } & Y \subseteq X \Rightarrow X \rightarrow Y \\
\text{Augmentation: } & X \rightarrow Y \Rightarrow XZ \rightarrow YZ \\
\text{Transitivity: } & X \rightarrow Y \land Y \rightarrow Z \Rightarrow X \rightarrow Z
\end{align}
$$

---

## 🏆 Performance Metrics

| Operation           | Time Complexity  | Space Complexity | Scalability         |
| ------------------- | ---------------- | ---------------- | ------------------- |
| FD Closure          | $O(n^3)$         | $O(n^2)$         | Good for $n < 1000$ |
| Decomposition Check | $O(n^2 \cdot m)$ | $O(n \cdot m)$   | Excellent           |
| SQL Generation      | $O(k \log k)$    | $O(k)$           | Very Good           |

Where:

* $n$ = attributes
* $m$ = FDs
* $k$ = query length

---

## 🔮 Future Enhancements

### **Planned Features**

* 🤖 ML-based schema optimization
* 🌐 Web UI
* 📱 Mobile App
* 🔄 Real-time collaboration
* 📈 Query performance analytics

### **Research Directions**

* Quantum database theory
* Distributed decomposition
* AI-powered normalization

---

## 📄 License

Licensed under the **MIT License** – see the [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

* Educational institutions and open-source mentors

---

**Made with ❤️ by Ankit Kumar**

*Relationator – Bridging Theory and Practice in Relational Database Design* 🚀
