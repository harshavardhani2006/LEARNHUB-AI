"""
reseed.py - Generates comprehensive multi-page PDFs for all resources
and uploads them to Supabase Storage.

Run: python reseed.py
"""

import os, sys, uuid, zlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv
load_dotenv()
from database import supabase

# ─────────────────────────────────────────────────────────────
#  Multi-page PDF builder (pure stdlib)
# ─────────────────────────────────────────────────────────────

class PDFBuilder:
    PAGE_W  = 612
    PAGE_H  = 792
    MARGIN  = 60
    LINE_H  = 16        # points per line (body)
    HEAD_H  = 22        # points per heading line
    TOP_Y   = 740       # starting Y per page

    def __init__(self):
        self._objs   = {}   # obj_id -> bytes
        self._pages  = []   # list of page obj ids
        # Reserve ids 1-5 for fixed objects (Catalog, Pages, Font×3).
        # Content streams and page dicts start at id 6.
        self._next   = 6
        # current page state
        self._cur_content_lines = []
        self._cur_y = self.TOP_Y

    # ── low-level helpers ─────────────────────────────────────

    def _alloc(self) -> int:
        oid = self._next
        self._next += 1
        return oid

    @staticmethod
    def _esc(s: str) -> str:
        return s.replace("\\","\\\\").replace("(","\\(").replace(")","\\)")

    @staticmethod
    def _compress(data: bytes) -> bytes:
        return zlib.compress(data, level=6)

    # ── page management ───────────────────────────────────────

    def _flush_page(self):
        """Finalise current page content and allocate PDF objects."""
        if not self._cur_content_lines:
            return
        stream_text = "\n".join(self._cur_content_lines).encode("latin-1", errors="replace")
        compressed  = self._compress(stream_text)

        content_id = self._alloc()
        self._objs[content_id] = (
            b"<< /Length " + str(len(compressed)).encode() + b" /Filter /FlateDecode >>\n"
            b"stream\n" + compressed + b"\nendstream"
        )

        page_id = self._alloc()
        self._objs[page_id] = (
            b"<< /Type /Page /Parent 2 0 R "
            b"/MediaBox [0 0 612 792] "
            b"/Contents " + str(content_id).encode() + b" 0 R "
            b"/Resources << /Font << "
            b"/F1 3 0 R "
            b"/F2 4 0 R "
            b"/F3 5 0 R "
            b">> >> >>"
        )
        self._pages.append(page_id)
        self._cur_content_lines = []
        self._cur_y = self.TOP_Y

    def _new_page(self):
        self._flush_page()

    def _ensure_space(self, needed: int):
        """Start a new page if there isn't enough vertical space."""
        if self._cur_y - needed < self.MARGIN:
            self._new_page()

    # ── content helpers ───────────────────────────────────────

    def add_title(self, text: str):
        """Document title — large, bold, centred, with underline."""
        self._ensure_space(60)
        e = self._esc(text)
        self._cur_content_lines += [
            "BT",
            "/F2 22 Tf",                        # bold font
            f"60 {self._cur_y} Td",
            f"({e}) Tj",
            "ET",
        ]
        self._cur_y -= 28
        # decorative line
        self._cur_content_lines += [
            f"60 {self._cur_y} m 552 {self._cur_y} l S",
        ]
        self._cur_y -= 18

    def add_chapter(self, text: str):
        """Chapter heading — bold, blue-ish tint via gray."""
        self._ensure_space(50)
        self._cur_y -= 10
        e = self._esc(text)
        self._cur_content_lines += [
            "BT",
            "/F2 15 Tf",
            f"60 {self._cur_y} Td",
            f"({e}) Tj",
            "ET",
        ]
        self._cur_y -= 4
        self._cur_content_lines += [
            f"60 {self._cur_y} m 552 {self._cur_y} l S",
        ]
        self._cur_y -= 14

    def add_section(self, text: str):
        """Section heading — bold, slightly smaller."""
        self._ensure_space(40)
        self._cur_y -= 6
        e = self._esc(text)
        self._cur_content_lines += [
            "BT",
            "/F2 12 Tf",
            f"60 {self._cur_y} Td",
            f"({e}) Tj",
            "ET",
        ]
        self._cur_y -= 16

    def add_body(self, text: str, indent: int = 0):
        """Body paragraph line."""
        self._ensure_space(self.LINE_H + 4)
        e = self._esc(text)
        x = 60 + indent
        self._cur_content_lines += [
            "BT",
            "/F1 10 Tf",
            f"{x} {self._cur_y} Td",
            f"({e}) Tj",
            "ET",
        ]
        self._cur_y -= self.LINE_H

    def add_code(self, text: str):
        """Monospace code line."""
        self._ensure_space(self.LINE_H + 2)
        e = self._esc(text)
        self._cur_content_lines += [
            "BT",
            "/F3 9 Tf",
            f"72 {self._cur_y} Td",
            f"({e}) Tj",
            "ET",
        ]
        self._cur_y -= self.LINE_H

    def add_blank(self, n: int = 1):
        self._cur_y -= self.LINE_H * n

    def add_bullet(self, text: str, indent: int = 0):
        self._ensure_space(self.LINE_H + 4)
        e = self._esc(text)
        x = 72 + indent
        bullet_x = x - 12
        self._cur_content_lines += [
            "BT",
            "/F1 10 Tf",
            f"{bullet_x} {self._cur_y} Td",
            "(•) Tj",
            "ET",
            "BT",
            "/F1 10 Tf",
            f"{x} {self._cur_y} Td",
            f"({e}) Tj",
            "ET",
        ]
        self._cur_y -= self.LINE_H

    def add_page_break(self):
        self._new_page()

    # ── build final PDF bytes ─────────────────────────────────

    def build(self) -> bytes:
        self._flush_page()   # flush last page

        # Fixed objects:
        # 1 – Catalog
        # 2 – Pages node
        # 3 – Font F1 (Helvetica / regular)
        # 4 – Font F2 (Helvetica-Bold / bold)
        # 5 – Font F3 (Courier / monospace)
        # 6+ – content streams and page dicts (allocated during rendering)

        pages_kids = b" ".join(
            str(pid).encode() + b" 0 R" for pid in self._pages
        )

        fixed = {
            1: b"<< /Type /Catalog /Pages 2 0 R >>",
            2: (
                b"<< /Type /Pages /Kids ["
                + pages_kids +
                b"] /Count " + str(len(self._pages)).encode() + b" >>"
            ),
            3: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            4: b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
            5: b"<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>",
        }

        all_objs = {**fixed, **self._objs}

        body     = b"%PDF-1.4\n"
        offsets  = {}

        for obj_id in sorted(all_objs.keys()):
            offsets[obj_id] = len(body)
            body += f"{obj_id} 0 obj\n".encode()
            body += all_objs[obj_id]
            body += b"\nendobj\n"

        total   = len(all_objs)
        xref_at = len(body)
        body   += b"xref\n"
        body   += f"0 {total + 1}\n".encode()
        body   += b"0000000000 65535 f \n"
        for oid in sorted(offsets.keys()):
            body += f"{offsets[oid]:010d} 00000 n \n".encode()
        body += b"trailer\n"
        body += f"<< /Size {total + 1} /Root 1 0 R >>\n".encode()
        body += b"startxref\n"
        body += f"{xref_at}\n".encode()
        body += b"%%EOF\n"
        return body


# ─────────────────────────────────────────────────────────────
#  Content builders for each resource
# ─────────────────────────────────────────────────────────────

def build_linear_algebra_pdf() -> bytes:
    p = PDFBuilder()

    p.add_title("Linear Algebra for Machine Learning")
    p.add_body("A comprehensive study guide covering all essential concepts with theory,")
    p.add_body("worked examples, and machine learning applications.")
    p.add_blank()
    p.add_body("Topics Covered:")
    p.add_bullet("Scalars, Vectors, Matrices, and Tensors")
    p.add_bullet("Vector Operations and Geometry")
    p.add_bullet("Matrix Operations and Properties")
    p.add_bullet("Special Matrices")
    p.add_bullet("Systems of Linear Equations")
    p.add_bullet("Determinants")
    p.add_bullet("Eigenvalues and Eigenvectors")
    p.add_bullet("Matrix Decompositions: LU, QR, SVD, Cholesky")
    p.add_bullet("Principal Component Analysis (PCA)")
    p.add_bullet("Applications in Machine Learning")
    p.add_page_break()

    # ── Chapter 1 ──────────────────────────────────────────
    p.add_chapter("Chapter 1: Fundamental Objects")
    p.add_section("1.1 Scalars")
    p.add_body("A scalar is a single real number. In ML, scalars represent quantities")
    p.add_body("like learning rate, loss value, or a single weight.")
    p.add_code("Example:  alpha = 0.01  (learning rate)")
    p.add_code("          n    = 1000   (number of samples)")
    p.add_blank()

    p.add_section("1.2 Vectors")
    p.add_body("A vector is an ordered list of numbers arranged in a column (or row).")
    p.add_body("Vectors represent a point or direction in n-dimensional space.")
    p.add_code("Column vector:   x = [x1, x2, ..., xn]^T")
    p.add_code("Row vector:      x = [x1, x2, ..., xn]")
    p.add_blank()
    p.add_body("In ML, a single training example is often represented as a vector.")
    p.add_body("Example: a house described by [area, bedrooms, bathrooms] = [1500, 3, 2]")
    p.add_blank()
    p.add_body("Notation: Vectors are written as bold lowercase letters: x, w, b")
    p.add_blank()

    p.add_section("1.3 Matrices")
    p.add_body("A matrix is a 2D array of numbers with m rows and n columns.")
    p.add_body("Notation: Capital bold letters: A, W, X.")
    p.add_code("A (m x n):    A[i][j] is element at row i, column j.")
    p.add_blank()
    p.add_body("In ML, the design matrix X stores all training samples.")
    p.add_code("X (n_samples x n_features): each row is one training example.")
    p.add_blank()

    p.add_section("1.4 Tensors")
    p.add_body("A tensor is a generalisation of scalars/vectors/matrices to N dimensions.")
    p.add_code("Scalar     = 0th-order tensor")
    p.add_code("Vector     = 1st-order tensor")
    p.add_code("Matrix     = 2nd-order tensor")
    p.add_code("3D array   = 3rd-order tensor (e.g. RGB image: height x width x 3)")
    p.add_body("Deep learning frameworks (PyTorch, TensorFlow) operate on tensors.")
    p.add_page_break()

    # ── Chapter 2 ──────────────────────────────────────────
    p.add_chapter("Chapter 2: Vector Operations")
    p.add_section("2.1 Vector Addition and Scalar Multiplication")
    p.add_code("u + v = [u1+v1, u2+v2, ..., un+vn]   (element-wise)")
    p.add_code("c * v = [c*v1, c*v2, ..., c*vn]       (scale every element)")
    p.add_blank()
    p.add_body("Properties: commutative, associative, distributive.")
    p.add_blank()

    p.add_section("2.2 Dot Product (Inner Product)")
    p.add_code("u . v = u1*v1 + u2*v2 + ... + un*vn   (scalar result)")
    p.add_code("     = ||u|| * ||v|| * cos(theta)")
    p.add_blank()
    p.add_body("Key facts:")
    p.add_bullet("Result is a scalar.")
    p.add_bullet("If u . v = 0 the vectors are orthogonal (perpendicular).")
    p.add_bullet("Measures how much two vectors point in the same direction.")
    p.add_bullet("Used in: neural net forward pass, cosine similarity, projections.")
    p.add_blank()
    p.add_body("Example:  u=[1,2,3], v=[4,5,6]  =>  u.v = 4+10+18 = 32")
    p.add_blank()

    p.add_section("2.3 Vector Norms")
    p.add_body("A norm measures the 'size' or magnitude of a vector.")
    p.add_code("L1 norm (Manhattan):   ||x||_1 = sum(|xi|)")
    p.add_code("L2 norm (Euclidean):   ||x||_2 = sqrt(sum(xi^2))")
    p.add_code("Lp norm:               ||x||_p = (sum(|xi|^p))^(1/p)")
    p.add_code("L-inf norm:            ||x||_inf = max(|xi|)")
    p.add_blank()
    p.add_body("ML uses:")
    p.add_bullet("L2 norm: distance between points, weight decay (Ridge regularization)")
    p.add_bullet("L1 norm: Lasso regularization (promotes sparsity)")
    p.add_blank()

    p.add_section("2.4 Unit Vectors and Normalisation")
    p.add_code("unit vector:  v_hat = v / ||v||  =>  ||v_hat|| = 1")
    p.add_body("Normalising a vector keeps its direction but sets magnitude to 1.")
    p.add_body("Used in: cosine similarity, attention mechanisms, batch normalisation.")
    p.add_blank()

    p.add_section("2.5 Cosine Similarity")
    p.add_code("cos_sim(u,v) = (u . v) / (||u|| * ||v||)  in range [-1, 1]")
    p.add_body("1 = identical direction, 0 = orthogonal, -1 = opposite direction.")
    p.add_body("Widely used in NLP, RAG, recommendation systems, and embeddings.")
    p.add_blank()

    p.add_section("2.6 Cross Product (3D only)")
    p.add_code("u x v = [u2*v3-u3*v2,  u3*v1-u1*v3,  u1*v2-u2*v1]")
    p.add_body("Result is a vector perpendicular to both u and v.")
    p.add_body("Magnitude = ||u||*||v||*sin(theta) = area of parallelogram.")
    p.add_page_break()

    # ── Chapter 3 ──────────────────────────────────────────
    p.add_chapter("Chapter 3: Matrix Operations")
    p.add_section("3.1 Matrix Addition")
    p.add_code("(A + B)[i][j] = A[i][j] + B[i][j]   (same shape required)")
    p.add_body("Used in: adding bias vectors, gradient accumulation.")
    p.add_blank()

    p.add_section("3.2 Matrix Multiplication")
    p.add_code("C = A * B   where A is (m x k) and B is (k x n)  =>  C is (m x n)")
    p.add_code("C[i][j] = sum over r of A[i][r] * B[r][j]")
    p.add_blank()
    p.add_body("Important properties:")
    p.add_bullet("NOT commutative: AB != BA in general.")
    p.add_bullet("IS associative: (AB)C = A(BC)")
    p.add_bullet("IS distributive: A(B+C) = AB + AC")
    p.add_bullet("(AB)^T = B^T A^T   (transpose reverses order)")
    p.add_blank()
    p.add_body("Example: X (100 x 4) * W (4 x 1) = predictions (100 x 1)")
    p.add_blank()

    p.add_section("3.3 Transpose")
    p.add_code("A^T[i][j] = A[j][i]   (rows become columns)")
    p.add_body("Properties: (A^T)^T = A,   (AB)^T = B^T A^T,   (A+B)^T = A^T + B^T")
    p.add_blank()

    p.add_section("3.4 Hadamard Product (Element-wise)")
    p.add_code("(A ⊙ B)[i][j] = A[i][j] * B[i][j]   (same shape)")
    p.add_body("Used in: dropout masks, attention gating, LSTM gates.")
    p.add_blank()

    p.add_section("3.5 Matrix Inverse")
    p.add_code("A^(-1) exists if and only if det(A) != 0  (A is square)")
    p.add_code("A * A^(-1) = A^(-1) * A = I")
    p.add_blank()
    p.add_body("Properties:")
    p.add_bullet("(AB)^(-1) = B^(-1) A^(-1)")
    p.add_bullet("(A^T)^(-1) = (A^(-1))^T")
    p.add_blank()
    p.add_body("Computationally expensive for large matrices. Use factorizations instead.")
    p.add_blank()

    p.add_section("3.6 Trace")
    p.add_code("tr(A) = sum of diagonal elements = A[1][1] + A[2][2] + ... + A[n][n]")
    p.add_body("Properties: tr(A) = tr(A^T),   tr(AB) = tr(BA),   tr(A+B) = tr(A)+tr(B)")
    p.add_body("tr(A) = sum of eigenvalues of A.")
    p.add_page_break()

    # ── Chapter 4 ──────────────────────────────────────────
    p.add_chapter("Chapter 4: Special Matrices")
    p.add_section("4.1 Identity Matrix  I")
    p.add_code("I[i][j] = 1 if i==j, else 0")
    p.add_code("A * I = I * A = A")
    p.add_blank()

    p.add_section("4.2 Zero Matrix")
    p.add_body("All entries are zero. Additive identity: A + 0 = A.")
    p.add_blank()

    p.add_section("4.3 Diagonal Matrix")
    p.add_code("D[i][j] = 0 for i != j")
    p.add_body("Easy to invert: D^(-1)[i][i] = 1 / D[i][i]")
    p.add_body("Scaling transformation. Sigma in SVD is diagonal.")
    p.add_blank()

    p.add_section("4.4 Symmetric Matrix")
    p.add_code("A = A^T   (i.e., A[i][j] = A[j][i])")
    p.add_body("Covariance matrices are always symmetric.")
    p.add_body("Symmetric matrices have real eigenvalues and orthogonal eigenvectors.")
    p.add_blank()

    p.add_section("4.5 Orthogonal Matrix")
    p.add_code("Q^T * Q = Q * Q^T = I   =>   Q^(-1) = Q^T")
    p.add_body("Rows and columns are mutually orthonormal unit vectors.")
    p.add_body("Preserves lengths and angles: ||Qx|| = ||x||")
    p.add_body("Examples: rotation matrices, reflection matrices, U and V in SVD.")
    p.add_blank()

    p.add_section("4.6 Positive Definite Matrix")
    p.add_code("A is positive definite if x^T A x > 0 for all non-zero x")
    p.add_body("All eigenvalues are strictly positive.")
    p.add_body("Required for Cholesky decomposition. Covariance matrices are PSD.")
    p.add_page_break()

    # ── Chapter 5 ──────────────────────────────────────────
    p.add_chapter("Chapter 5: Determinants")
    p.add_section("5.1 Definition")
    p.add_body("The determinant is a scalar value that encodes geometric and algebraic")
    p.add_body("properties of a square matrix.")
    p.add_code("Notation:  det(A)  or  |A|")
    p.add_blank()

    p.add_section("5.2 Computing Determinants")
    p.add_body("2x2 matrix:")
    p.add_code("det([[a,b],[c,d]]) = ad - bc")
    p.add_blank()
    p.add_body("3x3 matrix (cofactor expansion along row 1):")
    p.add_code("det(A) = a11*M11 - a12*M12 + a13*M13")
    p.add_body("where Mij is the minor (det of submatrix with row i, col j removed).")
    p.add_blank()
    p.add_body("For larger matrices: LU decomposition or Gaussian elimination.")
    p.add_blank()

    p.add_section("5.3 Geometric Interpretation")
    p.add_body("|det(A)| = volume of the parallelepiped formed by column vectors.")
    p.add_bullet("det = 0: matrix is singular, columns are linearly dependent.")
    p.add_bullet("det > 0: transformation preserves orientation.")
    p.add_bullet("det < 0: transformation reverses orientation.")
    p.add_blank()

    p.add_section("5.4 Properties")
    p.add_code("det(AB) = det(A) * det(B)")
    p.add_code("det(A^T) = det(A)")
    p.add_code("det(A^(-1)) = 1 / det(A)")
    p.add_code("det(cA) = c^n * det(A)  for n x n matrix A")
    p.add_page_break()

    # ── Chapter 6 ──────────────────────────────────────────
    p.add_chapter("Chapter 6: Systems of Linear Equations")
    p.add_section("6.1 Matrix Form")
    p.add_code("Ax = b")
    p.add_body("A: coefficient matrix (m x n), x: unknowns (n x 1), b: constants (m x 1)")
    p.add_blank()

    p.add_section("6.2 Solution Cases")
    p.add_bullet("Unique solution: det(A) != 0  =>  x = A^(-1) b")
    p.add_bullet("No solution: system is inconsistent (b not in column space of A)")
    p.add_bullet("Infinite solutions: underdetermined, infinitely many x satisfy Ax = b")
    p.add_blank()

    p.add_section("6.3 Gaussian Elimination")
    p.add_body("Reduce augmented matrix [A|b] to row echelon form using:")
    p.add_bullet("Row swap")
    p.add_bullet("Scalar multiplication of a row")
    p.add_bullet("Adding a multiple of one row to another")
    p.add_body("Then back-substitute to find x.")
    p.add_blank()

    p.add_section("6.4 Normal Equation (ML context)")
    p.add_body("Ordinary Least Squares minimises ||Xw - y||^2.")
    p.add_code("Closed-form solution:  w = (X^T X)^(-1) X^T y")
    p.add_body("X^T X must be invertible (requires X to be full column rank).")
    p.add_body("For large datasets, gradient descent is preferred over direct inversion.")
    p.add_page_break()

    # ── Chapter 7 ──────────────────────────────────────────
    p.add_chapter("Chapter 7: Eigenvalues and Eigenvectors")
    p.add_section("7.1 Definition")
    p.add_code("A v = lambda * v")
    p.add_body("v: eigenvector (non-zero vector whose direction is unchanged by A)")
    p.add_body("lambda: eigenvalue (scalar by which v is scaled)")
    p.add_blank()

    p.add_section("7.2 Finding Eigenvalues")
    p.add_body("Rearrange: (A - lambda*I) v = 0")
    p.add_body("For non-trivial solutions: det(A - lambda*I) = 0")
    p.add_code("Characteristic polynomial: p(lambda) = det(A - lambda*I)")
    p.add_code("Solve p(lambda) = 0 to get eigenvalues.")
    p.add_blank()
    p.add_body("Example: A = [[3,1],[0,2]]")
    p.add_code("det([[3-L,1],[0,2-L]]) = (3-L)(2-L) - 0 = 0")
    p.add_code("L^2 - 5L + 6 = 0  =>  L = 3 or L = 2")
    p.add_blank()

    p.add_section("7.3 Finding Eigenvectors")
    p.add_body("For each eigenvalue L, solve (A - L*I)v = 0 using Gaussian elimination.")
    p.add_blank()

    p.add_section("7.4 Eigendecomposition")
    p.add_body("If A has n linearly independent eigenvectors v1...vn with values L1...Ln:")
    p.add_code("A = Q * diag(lambda) * Q^(-1)")
    p.add_body("Q: matrix of eigenvectors (columns), diag(lambda): diagonal eigenvalue matrix.")
    p.add_body("Symmetric matrices: A = Q * Lambda * Q^T  (Q is orthogonal).")
    p.add_blank()

    p.add_section("7.5 Properties")
    p.add_bullet("tr(A) = sum of eigenvalues")
    p.add_bullet("det(A) = product of eigenvalues")
    p.add_bullet("A is invertible iff all eigenvalues are non-zero")
    p.add_bullet("Eigenvalues of A^k are lambda^k; eigenvectors unchanged")
    p.add_blank()

    p.add_section("7.6 ML Applications")
    p.add_bullet("PCA: eigenvectors of covariance matrix = principal components")
    p.add_bullet("Graph Laplacian: spectral clustering uses eigenvectors")
    p.add_bullet("Markov chains: stationary distribution is leading eigenvector")
    p.add_bullet("PageRank: eigenvalue problem on the web graph")
    p.add_page_break()

    # ── Chapter 8 ──────────────────────────────────────────
    p.add_chapter("Chapter 8: Matrix Decompositions")
    p.add_section("8.1 LU Decomposition")
    p.add_code("A = L * U")
    p.add_body("L: lower triangular matrix with 1s on diagonal.")
    p.add_body("U: upper triangular matrix.")
    p.add_body("Use: solving linear systems efficiently. O(n^2) after O(n^3) factorisation.")
    p.add_code("Forward substitution: Ly = b")
    p.add_code("Back substitution:    Ux = y")
    p.add_blank()

    p.add_section("8.2 QR Decomposition")
    p.add_code("A = Q * R")
    p.add_body("Q: orthogonal matrix (Q^T Q = I)")
    p.add_body("R: upper triangular matrix")
    p.add_body("Computed via Gram-Schmidt orthogonalisation or Householder reflections.")
    p.add_body("Use: solving least squares problems, computing eigenvalues (QR algorithm).")
    p.add_blank()

    p.add_section("8.3 Cholesky Decomposition")
    p.add_code("A = L * L^T   (A must be symmetric positive definite)")
    p.add_body("L: lower triangular matrix with positive diagonal entries.")
    p.add_body("2x faster than LU for symmetric PD matrices.")
    p.add_body("Use: Gaussian processes, sampling from multivariate normals, Kalman filter.")
    p.add_blank()

    p.add_section("8.4 Singular Value Decomposition (SVD)")
    p.add_body("SVD is the most important decomposition in data science and ML.")
    p.add_code("A = U * Sigma * V^T")
    p.add_body("A: any m x n matrix (does NOT need to be square)")
    p.add_body("U: m x m orthogonal matrix (left singular vectors)")
    p.add_body("Sigma: m x n diagonal matrix (singular values, descending order)")
    p.add_body("V^T: n x n orthogonal matrix (right singular vectors)")
    p.add_blank()
    p.add_body("Singular values sigma_i = sqrt(eigenvalues of A^T A)")
    p.add_blank()
    p.add_body("Key insight: sigma_1 >= sigma_2 >= ... >= 0")
    p.add_body("Rank of A = number of non-zero singular values.")
    p.add_blank()
    p.add_body("Truncated SVD (rank-k approximation):")
    p.add_code("A_k = U_k * Sigma_k * V_k^T   (best rank-k approximation in Frobenius norm)")
    p.add_blank()
    p.add_body("Applications:")
    p.add_bullet("Image compression: keep top-k singular values")
    p.add_bullet("Latent Semantic Analysis (LSA) in NLP")
    p.add_bullet("Recommender systems (matrix factorization)")
    p.add_bullet("Noise reduction / dimensionality reduction")
    p.add_bullet("Computing pseudo-inverse: A^+ = V Sigma^+ U^T")
    p.add_page_break()

    # ── Chapter 9 ──────────────────────────────────────────
    p.add_chapter("Chapter 9: Principal Component Analysis (PCA)")
    p.add_section("9.1 Motivation")
    p.add_body("High-dimensional data is hard to visualise and model.")
    p.add_body("PCA finds a lower-dimensional representation that preserves maximum variance.")
    p.add_blank()

    p.add_section("9.2 Covariance Matrix")
    p.add_code("Cov(X) = (1/(n-1)) * (X - mean)^T * (X - mean)    [p x p]")
    p.add_body("Cov[i][j] = covariance between feature i and feature j.")
    p.add_body("Diagonal entries = variances. Off-diagonal = covariances.")
    p.add_body("Symmetric and positive semi-definite.")
    p.add_blank()

    p.add_section("9.3 PCA Algorithm (Step by Step)")
    p.add_bullet("Step 1: Standardise the data (zero mean, unit variance per feature).")
    p.add_bullet("Step 2: Compute covariance matrix C = X^T X / (n-1).")
    p.add_bullet("Step 3: Compute eigendecomposition: C = Q Lambda Q^T.")
    p.add_bullet("Step 4: Sort eigenvectors by eigenvalue (descending).")
    p.add_bullet("Step 5: Select top-k eigenvectors (principal components).")
    p.add_bullet("Step 6: Project data: Z = X * W_k   where W_k are top-k eigenvectors.")
    p.add_blank()

    p.add_section("9.4 Explained Variance")
    p.add_code("Explained variance ratio_i = lambda_i / sum(lambda_j)")
    p.add_body("Choose k such that cumulative explained variance >= 95%.")
    p.add_blank()

    p.add_section("9.5 PCA via SVD")
    p.add_code("SVD: X = U Sigma V^T")
    p.add_body("Principal components = columns of V.")
    p.add_body("Projected data: Z = X V = U Sigma.")
    p.add_body("Singular values sigma_i = sqrt(n-1) * std of i-th principal component.")
    p.add_blank()

    p.add_section("9.6 Limitations of PCA")
    p.add_bullet("Only captures linear structure.")
    p.add_bullet("Sensitive to outliers and scale (must standardise first).")
    p.add_bullet("Interpretability: PCs are linear combinations of original features.")
    p.add_bullet("Alternatives: t-SNE, UMAP (non-linear), Kernel PCA.")
    p.add_page_break()

    # ── Chapter 10 ─────────────────────────────────────────
    p.add_chapter("Chapter 10: Linear Algebra in Machine Learning")
    p.add_section("10.1 Linear Regression")
    p.add_body("Model: y_hat = Xw  where X is design matrix, w is weight vector.")
    p.add_code("Loss: L(w) = ||Xw - y||^2 / n")
    p.add_code("Normal equation: w* = (X^T X)^(-1) X^T y")
    p.add_code("Gradient: dL/dw = (2/n) X^T (Xw - y) = 0")
    p.add_blank()

    p.add_section("10.2 Neural Networks")
    p.add_body("Each layer is a linear transformation followed by a non-linearity:")
    p.add_code("Z[l] = W[l] * A[l-1] + b[l]   (matrix-vector product)")
    p.add_code("A[l] = activation(Z[l])")
    p.add_body("W[l] is a weight matrix; b[l] is a bias vector.")
    p.add_body("Backprop computes gradients via the chain rule (Jacobian matrices).")
    p.add_blank()

    p.add_section("10.3 Attention Mechanism (Transformers)")
    p.add_code("Attention(Q, K, V) = softmax(Q K^T / sqrt(d_k)) V")
    p.add_body("Q, K, V are matrices of queries, keys, values.")
    p.add_body("QK^T is a matrix product scoring all query-key pairs.")
    p.add_blank()

    p.add_section("10.4 Regularisation")
    p.add_code("L2 (Ridge):   L = ||Xw - y||^2 + lambda * ||w||^2")
    p.add_code("Solution:     w* = (X^T X + lambda*I)^(-1) X^T y")
    p.add_body("Adding lambda*I makes X^T X invertible even if rank-deficient.")
    p.add_code("L1 (Lasso):   L = ||Xw - y||^2 + lambda * ||w||_1")
    p.add_body("L1 promotes sparse solutions (many weights exactly zero).")
    p.add_blank()

    p.add_section("10.5 Kernel Methods and Gram Matrices")
    p.add_code("K[i][j] = k(x_i, x_j)  (kernel / similarity matrix)")
    p.add_body("Gram matrix K is symmetric positive semi-definite.")
    p.add_body("SVM dual problem is a quadratic program involving K.")
    p.add_blank()

    p.add_section("10.6 Embeddings and Cosine Similarity")
    p.add_body("Word embeddings, image embeddings, and graph embeddings are vectors.")
    p.add_code("similarity(u, v) = (u . v) / (||u|| ||v||)")
    p.add_body("Nearest-neighbour search is a matrix product: X * q^T.")
    p.add_blank()

    p.add_section("10.7 Gradient Descent as Vector Update")
    p.add_code("theta = theta - alpha * gradient(L)")
    p.add_body("gradient(L) is a vector in parameter space.")
    p.add_body("Adam, RMSprop: element-wise scaling of gradient vector.")
    p.add_blank()

    p.add_section("10.8 Batch Normalization")
    p.add_code("x_norm = (x - mean) / std    (per feature, per mini-batch)")
    p.add_code("y = gamma * x_norm + beta     (learnable scale and shift)")
    p.add_body("Reduces internal covariate shift, speeds up training.")
    p.add_page_break()

    # ── Chapter 11 ─────────────────────────────────────────
    p.add_chapter("Chapter 11: Important Theorems and Identities")
    p.add_section("11.1 Rank and Null Space")
    p.add_code("rank(A) = number of linearly independent rows (= columns)")
    p.add_code("nullity(A) = n - rank(A)     (dimension of null space)")
    p.add_code("Rank-Nullity theorem: rank(A) + nullity(A) = n")
    p.add_blank()

    p.add_section("11.2 Matrix Norms")
    p.add_code("Frobenius norm:   ||A||_F = sqrt(sum of squared entries)")
    p.add_code("Spectral norm:    ||A||_2 = largest singular value of A")
    p.add_code("Nuclear norm:     ||A||_* = sum of singular values (used in matrix completion)")
    p.add_blank()

    p.add_section("11.3 Moore-Penrose Pseudo-inverse")
    p.add_code("A^+ = V Sigma^+ U^T   (via SVD)")
    p.add_body("Sigma^+ = replace non-zero diagonals with their reciprocals.")
    p.add_body("Gives least-norm solution when A is not square or not full rank.")
    p.add_blank()

    p.add_section("11.4 Matrix Calculus Identities")
    p.add_code("d/dx (x^T a) = a")
    p.add_code("d/dx (x^T A x) = (A + A^T) x   (= 2Ax if A is symmetric)")
    p.add_code("d/dA tr(AB) = B^T")
    p.add_code("d/dA log det(A) = A^(-T)")
    p.add_blank()

    p.add_section("11.5 Key Inequalities")
    p.add_body("Cauchy-Schwarz:   |u . v| <= ||u|| * ||v||")
    p.add_body("Triangle:         ||u + v|| <= ||u|| + ||v||")
    p.add_blank()

    p.add_chapter("Quick Reference Summary")
    p.add_body("Dot product:       u.v = sum(ui*vi)  = ||u||*||v||*cos(theta)")
    p.add_body("Matrix multiply:   C[i][j] = sum_k A[i][k]*B[k][j]")
    p.add_body("Eigendecomp:       Av = lambda*v  =>  A = Q*Lambda*Q^-1")
    p.add_body("SVD:               A = U*Sigma*V^T  (any matrix)")
    p.add_body("PCA:               project on top-k eigenvectors of covariance matrix")
    p.add_body("Normal equation:   w = (X^TX)^-1 X^Ty")
    p.add_body("Ridge solution:    w = (X^TX + lambdaI)^-1 X^Ty")

    return p.build()


def build_python_basics_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("Python Basics: Variables, Loops & Functions")
    p.add_body("A comprehensive guide for beginners covering all core Python concepts.")
    p.add_blank()
    p.add_body("Contents: Variables · Data Types · Operators · Control Flow")
    p.add_body("          Loops · Functions · Data Structures · File I/O · OOP Basics")
    p.add_page_break()

    p.add_chapter("Chapter 1: Python Overview")
    p.add_body("Python is a high-level, interpreted, dynamically typed programming language.")
    p.add_body("Created by Guido van Rossum (1991). Design philosophy: readability matters.")
    p.add_blank()
    p.add_section("1.1 Running Python")
    p.add_code("# Interactive: open terminal and type python3")
    p.add_code("# Script:      python3 my_script.py")
    p.add_code("# Notebook:    Jupyter or Google Colab")
    p.add_blank()
    p.add_section("1.2 Comments and Print")
    p.add_code("# This is a single-line comment")
    p.add_code("\"\"\" This is a multi-line")
    p.add_code("    docstring comment. \"\"\"")
    p.add_code("print('Hello, World!')    # output to console")
    p.add_page_break()

    p.add_chapter("Chapter 2: Variables and Data Types")
    p.add_section("2.1 Variables")
    p.add_body("Variables are named storage locations. No type declaration needed.")
    p.add_code("x = 10          # int")
    p.add_code("pi = 3.14159    # float")
    p.add_code("name = 'Alice'  # str")
    p.add_code("is_on = True    # bool")
    p.add_blank()
    p.add_section("2.2 Naming Rules")
    p.add_bullet("Start with letter or underscore, not digit.")
    p.add_bullet("Letters, digits, underscores only.")
    p.add_bullet("Case-sensitive: age != Age")
    p.add_bullet("Cannot use keywords: if, else, for, while, def, class, ...")
    p.add_blank()
    p.add_section("2.3 Data Types")
    p.add_code("int      : 0, -5, 1000000")
    p.add_code("float    : 3.14, -0.001, 1e10")
    p.add_code("str      : 'hello', \"world\"")
    p.add_code("bool     : True, False")
    p.add_code("NoneType : None  (absence of value)")
    p.add_blank()
    p.add_section("2.4 Type Conversion")
    p.add_code("int('42')    -> 42")
    p.add_code("float('3.5') -> 3.5")
    p.add_code("str(100)     -> '100'")
    p.add_code("bool(0)      -> False   bool(1) -> True")
    p.add_page_break()

    p.add_chapter("Chapter 3: Operators")
    p.add_section("3.1 Arithmetic")
    p.add_code("+   addition          5 + 3  = 8")
    p.add_code("-   subtraction       5 - 3  = 2")
    p.add_code("*   multiplication    5 * 3  = 15")
    p.add_code("/   division (float)  7 / 2  = 3.5")
    p.add_code("//  floor division    7 // 2 = 3")
    p.add_code("%   modulus           7 % 2  = 1")
    p.add_code("**  exponentiation    2 ** 8 = 256")
    p.add_blank()
    p.add_section("3.2 Comparison")
    p.add_code("==  equal         !=  not equal")
    p.add_code("<   less than     >   greater than")
    p.add_code("<=  less or eq    >=  greater or eq")
    p.add_blank()
    p.add_section("3.3 Logical")
    p.add_code("and  : True if both operands True")
    p.add_code("or   : True if at least one is True")
    p.add_code("not  : inverts boolean  not True -> False")
    p.add_blank()
    p.add_section("3.4 Assignment Operators")
    p.add_code("=   x = 5     +=  x += 3  ->  x = 8")
    p.add_code("-=  x -= 2    *=  x *= 4  /=  x /= 2")
    p.add_code("//= **= %=  work the same way")
    p.add_page_break()

    p.add_chapter("Chapter 4: Control Flow")
    p.add_section("4.1 if / elif / else")
    p.add_code("score = 85")
    p.add_code("if score >= 90:")
    p.add_code("    print('A')")
    p.add_code("elif score >= 80:")
    p.add_code("    print('B')")
    p.add_code("elif score >= 70:")
    p.add_code("    print('C')")
    p.add_code("else:")
    p.add_code("    print('F')")
    p.add_blank()
    p.add_section("4.2 Ternary / Conditional Expression")
    p.add_code("result = 'pass' if score >= 60 else 'fail'")
    p.add_page_break()

    p.add_chapter("Chapter 5: Loops")
    p.add_section("5.1 for Loop")
    p.add_code("for i in range(5):      # 0 1 2 3 4")
    p.add_code("    print(i)")
    p.add_code("")
    p.add_code("for item in ['a','b','c']:")
    p.add_code("    print(item)")
    p.add_code("")
    p.add_code("for k, v in {'x':1,'y':2}.items():")
    p.add_code("    print(k, '->', v)")
    p.add_blank()
    p.add_section("5.2 range()")
    p.add_code("range(5)       -> 0,1,2,3,4")
    p.add_code("range(2, 8)    -> 2,3,4,5,6,7")
    p.add_code("range(0,10, 2) -> 0,2,4,6,8")
    p.add_code("range(10,0,-1) -> 10,9,...,1")
    p.add_blank()
    p.add_section("5.3 while Loop")
    p.add_code("count = 0")
    p.add_code("while count < 5:")
    p.add_code("    print(count)")
    p.add_code("    count += 1")
    p.add_blank()
    p.add_section("5.4 Loop Control")
    p.add_code("break    : exit loop immediately")
    p.add_code("continue : skip rest of current iteration, go to next")
    p.add_code("else     : on for/while runs if loop completes without break")
    p.add_blank()
    p.add_section("5.5 enumerate and zip")
    p.add_code("for i, v in enumerate(['a','b','c']):")
    p.add_code("    print(i, v)   # 0 a, 1 b, 2 c")
    p.add_code("")
    p.add_code("for x, y in zip([1,2,3], ['a','b','c']):")
    p.add_code("    print(x, y)   # 1 a, 2 b, 3 c")
    p.add_page_break()

    p.add_chapter("Chapter 6: Functions")
    p.add_section("6.1 Defining Functions")
    p.add_code("def greet(name):")
    p.add_code("    \"\"\"Return a greeting string.\"\"\"")
    p.add_code("    return 'Hello, ' + name")
    p.add_blank()
    p.add_section("6.2 Default Arguments")
    p.add_code("def power(base, exp=2):")
    p.add_code("    return base ** exp")
    p.add_code("power(3)    # 9   (exp defaults to 2)")
    p.add_code("power(3, 3) # 27")
    p.add_blank()
    p.add_section("6.3 *args and **kwargs")
    p.add_code("def total(*nums):")
    p.add_code("    return sum(nums)   # nums is a tuple")
    p.add_code("")
    p.add_code("def display(**info):")
    p.add_code("    for k,v in info.items(): print(k,v)  # info is a dict")
    p.add_blank()
    p.add_section("6.4 Lambda Functions")
    p.add_code("square = lambda x: x ** 2")
    p.add_code("add    = lambda x, y: x + y")
    p.add_blank()
    p.add_section("6.5 Scope: LEGB Rule")
    p.add_bullet("Local: variables defined inside the function.")
    p.add_bullet("Enclosing: in enclosing function (closures).")
    p.add_bullet("Global: module-level variables.")
    p.add_bullet("Built-in: Python built-in names (len, print, ...).")
    p.add_page_break()

    p.add_chapter("Chapter 7: Data Structures")
    p.add_section("7.1 List")
    p.add_code("lst = [1, 2, 3, 4, 5]")
    p.add_code("lst.append(6)         # add to end")
    p.add_code("lst.insert(0, 0)      # insert at index")
    p.add_code("lst.pop()             # remove & return last")
    p.add_code("lst.remove(3)         # remove first occurrence of 3")
    p.add_code("lst.sort()            # sort in place")
    p.add_code("sorted(lst)           # return sorted copy")
    p.add_code("lst[1:4]              # slicing -> [2,3,4]")
    p.add_code("lst[::-1]             # reverse")
    p.add_blank()
    p.add_section("7.2 List Comprehension")
    p.add_code("squares = [x**2 for x in range(10)]")
    p.add_code("evens   = [x for x in range(20) if x % 2 == 0]")
    p.add_code("matrix  = [[i*j for j in range(5)] for i in range(5)]")
    p.add_blank()
    p.add_section("7.3 Dictionary")
    p.add_code("d = {'name': 'Alice', 'age': 30}")
    p.add_code("d['email'] = 'alice@example.com'  # add key")
    p.add_code("d.get('phone', 'N/A')             # safe get with default")
    p.add_code("d.keys()   d.values()   d.items()")
    p.add_code("del d['age']                      # remove key")
    p.add_blank()
    p.add_section("7.4 Tuple")
    p.add_code("t = (1, 2, 3)  # immutable")
    p.add_code("a, b, c = t    # unpacking")
    p.add_blank()
    p.add_section("7.5 Set")
    p.add_code("s = {1, 2, 3, 2, 1}  # -> {1, 2, 3}  unique values")
    p.add_code("s.add(4)   s.remove(2)")
    p.add_code("A | B  # union   A & B  # intersection   A - B  # difference")
    p.add_page_break()

    p.add_chapter("Chapter 8: String Operations")
    p.add_code("s = 'Hello, World!'")
    p.add_code("s.upper()     s.lower()     s.strip()")
    p.add_code("s.split(',')  # -> ['Hello', ' World!']")
    p.add_code("', '.join(['a','b','c'])  # -> 'a, b, c'")
    p.add_code("s.replace('World', 'Python')")
    p.add_code("s.startswith('He')  s.endswith('!')")
    p.add_code("f'My name is {name}'  # f-string (Python 3.6+)")
    p.add_code("'{} is {}'.format(name, age)")
    p.add_page_break()

    p.add_chapter("Chapter 9: File I/O")
    p.add_code("# Reading")
    p.add_code("with open('file.txt', 'r') as f:")
    p.add_code("    content = f.read()")
    p.add_code("    lines = f.readlines()")
    p.add_blank()
    p.add_code("# Writing")
    p.add_code("with open('out.txt', 'w') as f:")
    p.add_code("    f.write('Hello\\n')")
    p.add_blank()
    p.add_code("# Appending")
    p.add_code("with open('log.txt', 'a') as f:")
    p.add_code("    f.write('new line\\n')")
    p.add_blank()
    p.add_code("# CSV with csv module")
    p.add_code("import csv")
    p.add_code("with open('data.csv') as f:")
    p.add_code("    reader = csv.DictReader(f)")
    p.add_code("    for row in reader: print(row)")
    p.add_page_break()

    p.add_chapter("Chapter 10: Object-Oriented Programming Basics")
    p.add_code("class Animal:")
    p.add_code("    species = 'Unknown'      # class attribute")
    p.add_code("")
    p.add_code("    def __init__(self, name, sound):")
    p.add_code("        self.name  = name    # instance attribute")
    p.add_code("        self.sound = sound")
    p.add_code("")
    p.add_code("    def speak(self):")
    p.add_code("        return f'{self.name} says {self.sound}'")
    p.add_code("")
    p.add_code("    def __repr__(self):")
    p.add_code("        return f'Animal({self.name})'")
    p.add_blank()
    p.add_code("class Dog(Animal):           # inheritance")
    p.add_code("    def __init__(self, name):")
    p.add_code("        super().__init__(name, 'Woof')")
    p.add_code("")
    p.add_code("    def fetch(self):")
    p.add_code("        return f'{self.name} fetches the ball!'")
    p.add_blank()
    p.add_body("Key OOP concepts: Encapsulation, Inheritance, Polymorphism, Abstraction.")

    return p.build()




def build_db_normalization_full_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("Database Normalization for Machine Learning")
    p.add_body("Comprehensive guide covering normal forms, functional dependencies, and practical examples with SQL.")
    p.add_blank()
    p.add_chapter("Chapter 1: Why Normalization?")
    p.add_body("Reduces redundancy, prevents update anomalies, and improves data integrity.")
    p.add_section("1.1 Redundancy Example")
    p.add_body("Consider a table storing user purchases with repeated product info…")
    p.add_blank()
    p.add_chapter("Chapter 2: Normal Forms")
    p.add_section("2.1 First Normal Form (1NF)")
    p.add_body("Eliminate repeating groups; each field contains atomic values.")
    p.add_section("2.2 Second Normal Form (2NF)")
    p.add_body("Remove partial dependencies; each non‑key attribute must depend on the whole primary key.")
    p.add_section("2.3 Third Normal Form (3NF)")
    p.add_body("Eliminate transitive dependencies; non‑key attributes depend only on the primary key.")
    p.add_section("2.4 Boyce‑Codd NF (BCNF)")
    p.add_body("Every determinant is a candidate key.")
    p.add_blank()
    p.add_chapter("Chapter 3: Practical SQL Examples")
    p.add_section("3.1 Decomposing a Table")
    p.add_code("-- Original denormalised table")
    p.add_code("CREATE TABLE purchases (user_id INT, product_name TEXT, product_price NUMERIC, purchase_date DATE);")
    p.add_blank()
    p.add_body("After converting to 3NF we split into Users, Products, Purchases tables.")
    p.add_code("CREATE TABLE users (user_id INT PRIMARY KEY, ...);")
    p.add_code("CREATE TABLE products (product_id SERIAL PRIMARY KEY, name TEXT, price NUMERIC);")
    p.add_code("CREATE TABLE purchases (purchase_id SERIAL PRIMARY KEY, user_id INT REFERENCES users(user_id), product_id INT REFERENCES products(product_id), purchase_date DATE);")
    p.add_blank()
    p.add_section("3.2 Querying with Joins")
    p.add_code("SELECT u.*, p.name, p.price, pu.purchase_date FROM users u JOIN purchases pu ON u.user_id = pu.user_id JOIN products p ON pu.product_id = p.product_id;")
    p.add_blank()
    p.add_chapter("Chapter 4: Normalization in ML Pipelines")
    p.add_body("Normalized tables simplify feature extraction, avoid duplicated rows, and make joins deterministic.")
    p.add_body("When exporting to CSV for training, each row maps to a single observation.")
    p.add_page_break()
    return p.build()


def build_db_normalization_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("Database Normalization: 1NF through BCNF")
    p.add_body("A comprehensive guide to relational database normalization")
    p.add_body("with theory, examples, and practical guidelines.")
    p.add_blank()
    p.add_body("Topics: Relational Model · Keys · Functional Dependencies")
    p.add_body("        1NF · 2NF · 3NF · BCNF · 4NF · Denormalization")
    p.add_page_break()

    p.add_chapter("Chapter 1: The Relational Model")
    p.add_section("1.1 Relations (Tables)")
    p.add_body("A relation is a two-dimensional table with rows (tuples) and columns (attributes).")
    p.add_body("Each row represents one entity instance.")
    p.add_blank()
    p.add_section("1.2 Properties of a Relation")
    p.add_bullet("Each cell contains a single atomic value.")
    p.add_bullet("Each column has a unique name.")
    p.add_bullet("All values in a column come from the same domain.")
    p.add_bullet("No two rows are identical (each has a unique primary key).")
    p.add_bullet("Order of rows and columns does not matter logically.")
    p.add_blank()
    p.add_section("1.3 Types of Keys")
    p.add_code("Super Key      : any set of attributes that uniquely identifies a row.")
    p.add_code("Candidate Key  : minimal super key (no redundant attributes).")
    p.add_code("Primary Key    : chosen candidate key (no NULLs allowed).")
    p.add_code("Alternate Key  : candidate key not chosen as primary key.")
    p.add_code("Foreign Key    : attribute referencing primary key of another relation.")
    p.add_code("Composite Key  : primary key made up of multiple attributes.")
    p.add_page_break()

    p.add_chapter("Chapter 2: Functional Dependencies")
    p.add_section("2.1 Definition")
    p.add_body("A functional dependency X -> Y means: knowing the value of X")
    p.add_body("uniquely determines the value of Y in every valid tuple.")
    p.add_code("StudentID -> StudentName   (StudentID determines StudentName)")
    p.add_blank()
    p.add_section("2.2 Types of Functional Dependencies")
    p.add_code("Full FD      : Y fully depends on ALL attributes of X.")
    p.add_code("Partial FD   : Y depends on PART of a composite X.")
    p.add_code("Transitive FD: X -> Y and Y -> Z implies X -> Z.")
    p.add_blank()
    p.add_section("2.3 Armstrong's Axioms")
    p.add_bullet("Reflexivity:  if Y subset of X, then X -> Y.")
    p.add_bullet("Augmentation: if X -> Y, then XZ -> YZ.")
    p.add_bullet("Transitivity: if X -> Y and Y -> Z, then X -> Z.")
    p.add_blank()
    p.add_section("2.4 Closure of an Attribute Set")
    p.add_body("X+ is the set of all attributes determined by X.")
    p.add_body("Algorithm: start with X+ = X, repeatedly apply FDs until no change.")
    p.add_page_break()

    p.add_chapter("Chapter 3: First Normal Form (1NF)")
    p.add_section("3.1 Definition")
    p.add_body("A table is in 1NF if:")
    p.add_bullet("Every column contains atomic (indivisible) values.")
    p.add_bullet("Each column has a unique name.")
    p.add_bullet("No repeating groups or arrays in any column.")
    p.add_bullet("A primary key is defined.")
    p.add_blank()
    p.add_section("3.2 Violation Example")
    p.add_code("STUDENT(SID, Name, Courses)")
    p.add_code("101, Alice, 'Math, Physics, CS'  <- multi-valued, NOT atomic")
    p.add_blank()
    p.add_section("3.3 1NF Fix")
    p.add_code("STUDENT_COURSE(SID, Name, Course)")
    p.add_code("101, Alice, Math")
    p.add_code("101, Alice, Physics")
    p.add_code("101, Alice, CS")
    p.add_body("PK = (SID, Course)  — composite key.")
    p.add_page_break()

    p.add_chapter("Chapter 4: Second Normal Form (2NF)")
    p.add_section("4.1 Definition")
    p.add_body("A table is in 2NF if:")
    p.add_bullet("It is in 1NF.")
    p.add_bullet("Every non-key attribute is FULLY functionally dependent on the ENTIRE primary key.")
    p.add_bullet("No partial dependencies (only applies when PK is composite).")
    p.add_blank()
    p.add_section("4.2 Violation Example")
    p.add_code("ORDER_ITEM(OrderID, ProductID, ProductName, Qty)")
    p.add_code("PK = (OrderID, ProductID)")
    p.add_code("FDs: (OrderID, ProductID) -> Qty         (full dependency, OK)")
    p.add_code("     ProductID -> ProductName            (PARTIAL dependency, VIOLATION)")
    p.add_blank()
    p.add_section("4.3 2NF Fix — Decompose")
    p.add_code("ORDER_ITEM(OrderID, ProductID, Qty)       <- removed ProductName")
    p.add_code("PRODUCT(ProductID, ProductName)           <- new table")
    p.add_body("Both tables are now in 2NF.")
    p.add_page_break()

    p.add_chapter("Chapter 5: Third Normal Form (3NF)")
    p.add_section("5.1 Definition")
    p.add_body("A table is in 3NF if:")
    p.add_bullet("It is in 2NF.")
    p.add_bullet("No transitive dependencies: no non-key attribute determines another non-key attr.")
    p.add_blank()
    p.add_section("5.2 Violation Example")
    p.add_code("EMPLOYEE(EmpID, EmpName, DeptID, DeptName)")
    p.add_code("PK = EmpID")
    p.add_code("FDs: EmpID -> EmpName, DeptID     (OK - full deps on PK)")
    p.add_code("     DeptID -> DeptName            (TRANSITIVE: EmpID->DeptID->DeptName)")
    p.add_blank()
    p.add_section("5.3 3NF Fix")
    p.add_code("EMPLOYEE(EmpID, EmpName, DeptID)")
    p.add_code("DEPARTMENT(DeptID, DeptName)")
    p.add_blank()
    p.add_section("5.4 Update Anomalies (why 3NF matters)")
    p.add_bullet("Insertion anomaly: can't add a dept without an employee.")
    p.add_bullet("Deletion anomaly: deleting last employee in dept loses dept info.")
    p.add_bullet("Update anomaly: changing dept name requires updating all employee rows.")
    p.add_page_break()

    p.add_chapter("Chapter 6: Boyce-Codd Normal Form (BCNF)")
    p.add_section("6.1 Definition")
    p.add_body("A table is in BCNF if:")
    p.add_bullet("It is in 3NF.")
    p.add_bullet("For every non-trivial FD X -> Y, X is a super key.")
    p.add_body("BCNF is stricter than 3NF. Most 3NF tables are also in BCNF.")
    p.add_blank()
    p.add_section("6.2 3NF but NOT BCNF (rare case)")
    p.add_code("TEACH(Student, Subject, Teacher)")
    p.add_code("FDs: (Student, Subject) -> Teacher   (PK)")
    p.add_code("     Teacher -> Subject               (Teacher determines Subject)")
    p.add_code("'Teacher' is NOT a super key -> BCNF violation.")
    p.add_blank()
    p.add_section("6.3 BCNF Fix")
    p.add_code("TEACHER_SUBJECT(Teacher, Subject)")
    p.add_code("STUDENT_TEACHER(Student, Teacher)")
    p.add_page_break()

    p.add_chapter("Chapter 7: Higher Normal Forms")
    p.add_section("7.1 Fourth Normal Form (4NF)")
    p.add_body("Deals with multi-valued dependencies (MVD).")
    p.add_body("X ->> Y means: for each value of X, the set of Y values is independent")
    p.add_body("of all other attributes.")
    p.add_body("4NF: for every MVD X ->> Y, X is a super key.")
    p.add_blank()
    p.add_section("7.2 Fifth Normal Form (5NF / PJNF)")
    p.add_body("Eliminates join dependencies not implied by candidate keys.")
    p.add_body("Rarely encountered in practice.")
    p.add_page_break()

    p.add_chapter("Chapter 8: Denormalization")
    p.add_section("8.1 What Is It?")
    p.add_body("Intentionally introducing redundancy to improve read performance.")
    p.add_body("Common in OLAP, data warehouses, reporting databases.")
    p.add_blank()
    p.add_section("8.2 Techniques")
    p.add_bullet("Storing computed aggregates (total_sales per customer).")
    p.add_bullet("Pre-joining frequently queried tables.")
    p.add_bullet("Adding redundant columns to avoid JOINs.")
    p.add_bullet("Partitioning and sharding large tables.")
    p.add_blank()
    p.add_section("8.3 Trade-offs")
    p.add_code("Pros: faster reads, simpler queries, better cache utilisation.")
    p.add_code("Cons: data inconsistency risk, larger storage, harder updates.")
    p.add_blank()

    p.add_chapter("Chapter 9: Practical Normalization Checklist")
    p.add_bullet("1. List all attributes and identify the primary key.")
    p.add_bullet("2. Ensure all values are atomic -> 1NF.")
    p.add_bullet("3. Check for partial dependencies on composite PK -> 2NF.")
    p.add_bullet("4. Check for transitive dependencies -> 3NF.")
    p.add_bullet("5. Verify every determinant is a candidate key -> BCNF.")
    p.add_bullet("6. Decide if denormalization is appropriate for performance.")

    return p.build()




def build_react_hooks_full_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("React Hooks: A Full‑Textbook Guide for ML Engineers")
    p.add_body("Deep dive into functional components, state management, and side‑effects with practical ML‑centric examples.")
    p.add_blank()
    p.add_chapter("Chapter 1: Foundations")
    p.add_section("1.1 Functional Components")
    p.add_body("Simpler syntax, no this binding, easier to test.")
    p.add_code("function Counter() { const [count, setCount] = useState(0); return (<div>{count}</div>); }")
    p.add_blank()
    p.add_section("1.2 useState Hook")
    p.add_body("Manages local component state.")
    p.add_code("const [data, setData] = useState(null);")
    p.add_blank()
    p.add_chapter("Chapter 2: Side Effects with useEffect")
    p.add_section("2.1 Data Fetching")
    p.add_body("Typical pattern for loading a dataset from an API before training a model.")
    p.add_code("useEffect(() => { fetch('/api/dataset').then(r=>r.json()).then(setData); }, []);")
    p.add_blank()
    p.add_section("2.2 Cleanup")
    p.add_body("Cancel subscriptions, abort fetch requests to avoid memory leaks.")
    p.add_code("return () => controller.abort();")
    p.add_blank()
    p.add_chapter("Chapter 3: Advanced Hooks")
    p.add_section("3.1 useReducer for Complex State")
    p.add_body("Useful for managing training‑loop state, hyper‑parameters, and step counters.")
    p.add_code("const [state, dispatch] = useReducer(reducer, initialState);")
    p.add_blank()
    p.add_section("3.2 Custom Hooks")
    p.add_body("Encapsulate reusable logic, e.g., useWebSocket for streaming model metrics.")
    p.add_code("function useWebSocket(url) { const [msg, setMsg] = useState(null); useEffect(() => { const ws = new WebSocket(url); ws.onmessage = e => setMsg(e.data); return () => ws.close(); }, [url]); return msg; }")
    p.add_blank()
    p.add_chapter("Chapter 4: Performance Optimisations")
    p.add_section("4.1 memo and useCallback")
    p.add_body("Prevent unnecessary re‑renders of heavy visualisations.")
    p.add_code("const memoizedChart = useMemo(() => <Chart data={data} />, [data]);")
    p.add_blank()
    p.add_section("4.2 Suspense and Lazy Loading")
    p.add_body("Load heavy model‑viewer components only when needed.")
    p.add_code("const ModelViewer = React.lazy(() => import('./ModelViewer'));")
    p.add_blank()
    p.add_page_break()
    return p.build()


def build_react_hooks_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("React Hooks: Complete Reference Guide")
    p.add_body("Comprehensive coverage of all React hooks with patterns,")
    p.add_body("best practices, and real-world examples.")
    p.add_page_break()

    p.add_chapter("Chapter 1: Introduction to Hooks")
    p.add_body("Hooks were introduced in React 16.8 (2019) to allow function components")
    p.add_body("to use state and lifecycle features previously only available in classes.")
    p.add_blank()
    p.add_section("Rules of Hooks (NEVER break these)")
    p.add_bullet("Only call hooks at the top level of a React function.")
    p.add_bullet("Never call hooks inside loops, conditionals, or nested functions.")
    p.add_bullet("Only call hooks from React function components or custom hooks.")
    p.add_page_break()

    p.add_chapter("Chapter 2: useState")
    p.add_code("const [state, setState] = useState(initialValue);")
    p.add_blank()
    p.add_section("2.1 Basic Usage")
    p.add_code("const [count, setCount] = useState(0);")
    p.add_code("const [name, setName]   = useState('');")
    p.add_code("const [user, setUser]   = useState(null);")
    p.add_blank()
    p.add_section("2.2 Functional Updates")
    p.add_code("setCount(prev => prev + 1);   // safe with async batching")
    p.add_body("Use functional updates when new state depends on old state.")
    p.add_blank()
    p.add_section("2.3 Lazy Initialization")
    p.add_code("const [data, setData] = useState(() => expensiveComputation());")
    p.add_body("The function runs only on first render.")
    p.add_blank()
    p.add_section("2.4 Object / Array State")
    p.add_code("const [form, setForm] = useState({ name: '', email: '' });")
    p.add_code("// Must spread to preserve other fields:")
    p.add_code("setForm(prev => ({ ...prev, name: 'Alice' }));")
    p.add_page_break()

    p.add_chapter("Chapter 3: useEffect")
    p.add_code("useEffect(() => {")
    p.add_code("  // effect code")
    p.add_code("  return () => { /* cleanup */ };")
    p.add_code("}, [dependencies]);")
    p.add_blank()
    p.add_section("3.1 Dependency Array Rules")
    p.add_code("useEffect(() => { ... });         // runs after EVERY render")
    p.add_code("useEffect(() => { ... }, []);     // runs ONCE on mount")
    p.add_code("useEffect(() => { ... }, [dep]);  // runs when dep changes")
    p.add_blank()
    p.add_section("3.2 Common Patterns")
    p.add_body("Data fetching:")
    p.add_code("useEffect(() => {")
    p.add_code("  let cancelled = false;")
    p.add_code("  fetch('/api/data')")
    p.add_code("    .then(r => r.json())")
    p.add_code("    .then(d => { if (!cancelled) setData(d); });")
    p.add_code("  return () => { cancelled = true; };")
    p.add_code("}, []);")
    p.add_blank()
    p.add_body("Event listener:")
    p.add_code("useEffect(() => {")
    p.add_code("  window.addEventListener('resize', handler);")
    p.add_code("  return () => window.removeEventListener('resize', handler);")
    p.add_code("}, [handler]);")
    p.add_page_break()

    p.add_chapter("Chapter 4: useContext")
    p.add_code("const ThemeContext = React.createContext('light');")
    p.add_code("")
    p.add_code("function App() {")
    p.add_code("  return (")
    p.add_code("    <ThemeContext.Provider value='dark'>")
    p.add_code("      <Child />")
    p.add_code("    </ThemeContext.Provider>")
    p.add_code("  );")
    p.add_code("}")
    p.add_code("")
    p.add_code("function Child() {")
    p.add_code("  const theme = useContext(ThemeContext);  // 'dark'")
    p.add_code("  return <div className={theme}>Hello</div>;")
    p.add_code("}")
    p.add_page_break()

    p.add_chapter("Chapter 5: useRef")
    p.add_code("const ref = useRef(initialValue);")
    p.add_blank()
    p.add_section("5.1 DOM References")
    p.add_code("const inputRef = useRef(null);")
    p.add_code("useEffect(() => { inputRef.current.focus(); }, []);")
    p.add_code("return <input ref={inputRef} />;")
    p.add_blank()
    p.add_section("5.2 Storing Mutable Values")
    p.add_code("const timerRef = useRef(null);")
    p.add_code("// Does NOT trigger re-render when changed")
    p.add_code("timerRef.current = setInterval(tick, 1000);")
    p.add_page_break()

    p.add_chapter("Chapter 6: useMemo and useCallback")
    p.add_section("6.1 useMemo")
    p.add_code("const sorted = useMemo(")
    p.add_code("  () => [...items].sort((a,b) => a.name.localeCompare(b.name)),")
    p.add_code("  [items]")
    p.add_code(");")
    p.add_body("Recomputes only when 'items' changes. Prevents expensive recalculations.")
    p.add_blank()
    p.add_section("6.2 useCallback")
    p.add_code("const handleClick = useCallback(() => {")
    p.add_code("  dispatch({ type: 'INCREMENT' });")
    p.add_code("}, [dispatch]);")
    p.add_body("Stable function reference. Prevents child re-renders when passed as prop.")
    p.add_blank()
    p.add_section("6.3 When to use")
    p.add_bullet("useMemo: expensive computations, stable reference for object/array props.")
    p.add_bullet("useCallback: callbacks passed to React.memo children, event handlers.")
    p.add_bullet("Don't overuse: premature optimization costs readability.")
    p.add_page_break()

    p.add_chapter("Chapter 7: useReducer")
    p.add_code("function reducer(state, action) {")
    p.add_code("  switch (action.type) {")
    p.add_code("    case 'increment': return { count: state.count + 1 };")
    p.add_code("    case 'decrement': return { count: state.count - 1 };")
    p.add_code("    case 'reset':     return { count: 0 };")
    p.add_code("    default: throw new Error('Unknown action');")
    p.add_code("  }")
    p.add_code("}")
    p.add_code("")
    p.add_code("const [state, dispatch] = useReducer(reducer, { count: 0 });")
    p.add_code("dispatch({ type: 'increment' });")
    p.add_blank()
    p.add_body("Use useReducer when state logic involves multiple sub-values or")
    p.add_body("when next state depends on complex transitions.")
    p.add_page_break()

    p.add_chapter("Chapter 8: Custom Hooks")
    p.add_body("Custom hooks extract reusable stateful logic into named functions.")
    p.add_code("// useFetch.js")
    p.add_code("function useFetch(url) {")
    p.add_code("  const [data, setData]       = useState(null);")
    p.add_code("  const [loading, setLoading] = useState(true);")
    p.add_code("  const [error, setError]     = useState(null);")
    p.add_code("")
    p.add_code("  useEffect(() => {")
    p.add_code("    fetch(url)")
    p.add_code("      .then(r => r.json())")
    p.add_code("      .then(setData)")
    p.add_code("      .catch(setError)")
    p.add_code("      .finally(() => setLoading(false));")
    p.add_code("  }, [url]);")
    p.add_code("")
    p.add_code("  return { data, loading, error };")
    p.add_code("}")
    p.add_blank()
    p.add_code("// Usage")
    p.add_code("const { data, loading, error } = useFetch('/api/users');")
    p.add_page_break()

    p.add_chapter("Chapter 9: Additional Hooks")
    p.add_section("9.1 useLayoutEffect")
    p.add_body("Like useEffect but fires synchronously after DOM mutations, before paint.")
    p.add_body("Use for: measuring DOM elements, synchronising animation state.")
    p.add_blank()
    p.add_section("9.2 useId")
    p.add_code("const id = useId();   // stable unique ID per component instance")
    p.add_body("Useful for associating labels with inputs in accessible UIs.")
    p.add_blank()
    p.add_section("9.3 useTransition (React 18)")
    p.add_code("const [isPending, startTransition] = useTransition();")
    p.add_code("startTransition(() => { setQuery(input); });")
    p.add_body("Marks state updates as non-urgent, keeps UI responsive.")
    p.add_blank()
    p.add_section("9.4 useDeferredValue (React 18)")
    p.add_code("const deferred = useDeferredValue(heavyValue);")
    p.add_body("Defers updating a value until more urgent updates are done.")

    return p.build()




def build_neural_networks_full_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("Neural Networks: Theory and Practice for ML")
    p.add_body("A textbook‑style treatment of feed‑forward networks, back‑propagation, regularisation, and modern architectures.")
    p.add_blank()
    p.add_chapter("Chapter 1: Perceptron and Linear Models")
    p.add_section("1.1 Single‑Layer Perceptron")
    p.add_body("Binary classifier that computes sign(w·x + b).")
    p.add_code("y = 1 if np.dot(w, x) + b > 0 else 0")
    p.add_blank()
    p.add_section("1.2 Limitations of Linear Models")
    p.add_body("Can only separate linearly‑separable data; XOR problem demonstration.")
    p.add_blank()
    p.add_chapter("Chapter 2: Multi‑Layer Networks and Back‑Propagation")
    p.add_section("2.1 Activation Functions")
    p.add_body("ReLU, sigmoid, tanh – definitions and gradients.")
    p.add_code("def relu(z): return np.maximum(0, z)")
    p.add_code("def relu_grad(z): return (z > 0).astype(float)")
    p.add_blank()
    p.add_section("2.2 Forward Pass")
    p.add_body("Compute layer outputs sequentially.")
    p.add_code("a1 = relu(np.dot(W1, x) + b1)")
    p.add_code("a2 = relu(np.dot(W2, a1) + b2)")
    p.add_blank()
    p.add_section("2.3 Back‑Propagation Derivation")
    p.add_body("Chain rule applied layer‑by‑layer to compute gradients of loss w.r.t. weights.")
    p.add_code("delta3 = (a3 - y) * sigmoid_grad(z3)")
    p.add_code("delta2 = np.dot(W3.T, delta3) * relu_grad(z2)")
    p.add_code("grad_W2 = np.outer(delta2, a1)")
    p.add_blank()
    p.add_chapter("Chapter 3: Regularisation and Optimisers")
    p.add_section("3.1 L2 (Weight Decay)")
    p.add_body("Add lambda * ||W||^2 to loss; gradient includes lambda * W.")
    p.add_section("3.2 Adam Optimiser")
    p.add_body("Adaptive learning rates per parameter using moment estimates.")
    p.add_code("m = beta1 * m + (1-beta1) * grad")
    p.add_code("v = beta2 * v + (1-beta2) * (grad**2)")
    p.add_blank()
    p.add_chapter("Chapter 4: Modern Architectures")
    p.add_section("4.1 Convolutional Neural Networks (CNN)")
    p.add_body("Explain kernels, stride, padding, and feature maps.")
    p.add_code("conv = tf.nn.conv2d(input, filters, strides=[1,1,1,1], padding='SAME')")
    p.add_blank()
    p.add_section("4.2 Transformers and Attention")
    p.add_body("Self‑attention mechanism with query, key, value matrices.")
    p.add_code("scores = tf.matmul(Q, K, transpose_b=True) / tf.sqrt(d_k)")
    p.add_code("weights = tf.nn.softmax(scores)")
    p.add_code("context = tf.matmul(weights, V)")
    p.add_blank()
    p.add_chapter("Chapter 5: Training Tips and Debugging")
    p.add_section("5.1 Learning Rate Schedules")
    p.add_body("Step decay, cosine annealing, warm‑up.")
    p.add_section("5.2 Gradient Checking")
    p.add_body("Numerical approximation to verify back‑prop implementation.")
    p.add_code("grad_approx = (loss(theta+epsilon) - loss(theta-epsilon)) / (2*epsilon)")
    p.add_blank()
    p.add_page_break()
    return p.build()


def build_neural_networks_pdf() -> bytes:
    p = PDFBuilder()
    p.add_title("Introduction to Neural Networks")
    p.add_body("Complete guide: perceptrons, architectures, training, and applications.")
    p.add_page_break()

    p.add_chapter("Chapter 1: Biological Inspiration")
    p.add_body("The brain has ~86 billion neurons connected by ~100 trillion synapses.")
    p.add_body("Each neuron sums weighted inputs; fires if threshold is exceeded.")
    p.add_body("Neural networks loosely model this with mathematical neurons.")
    p.add_blank()
    p.add_section("Key Differences from Biological Neurons")
    p.add_bullet("ANN neurons use fixed mathematical activation, not complex biology.")
    p.add_bullet("ANNs learn through backpropagation, not spike-timing plasticity.")
    p.add_bullet("ANNs are far simpler but highly effective for pattern recognition.")
    p.add_page_break()

    p.add_chapter("Chapter 2: The Perceptron")
    p.add_section("2.1 Single Neuron")
    p.add_code("z = w1*x1 + w2*x2 + ... + wn*xn + b")
    p.add_code("y = activation(z)")
    p.add_blank()
    p.add_section("2.2 Activation Functions")
    p.add_code("Step:    f(z) = 1 if z>=0, else 0   (original perceptron)")
    p.add_code("Sigmoid: f(z) = 1/(1+e^-z)   range (0,1)   smooth gradient")
    p.add_code("Tanh:    f(z) = (e^z-e^-z)/(e^z+e^-z)   range (-1,1)")
    p.add_code("ReLU:    f(z) = max(0, z)   most popular hidden-layer activation")
    p.add_code("Leaky:   f(z) = max(0.01z, z)   avoids dying ReLU problem")
    p.add_code("ELU:     f(z) = z if z>0, else alpha*(e^z-1)")
    p.add_code("Softmax: f(z_i) = e^z_i / sum(e^z_j)   output for multi-class")
    p.add_blank()
    p.add_section("2.3 When to Use Which")
    p.add_bullet("Hidden layers: ReLU (default), Leaky ReLU, ELU.")
    p.add_bullet("Binary output: Sigmoid.")
    p.add_bullet("Multi-class output: Softmax.")
    p.add_bullet("Regression output: Linear (no activation).")
    p.add_page_break()

    p.add_chapter("Chapter 3: Multi-Layer Perceptron (MLP)")
    p.add_section("3.1 Architecture")
    p.add_code("Input Layer  -> Hidden Layer 1 -> ... -> Hidden Layer N -> Output Layer")
    p.add_body("Depth = number of layers.  Width = number of neurons per layer.")
    p.add_body("Universal Approximation Theorem: a 1-hidden-layer MLP with enough neurons")
    p.add_body("can approximate any continuous function on a compact domain.")
    p.add_blank()
    p.add_section("3.2 Forward Propagation")
    p.add_code("For each layer l = 1 to L:")
    p.add_code("  Z[l] = W[l] * A[l-1] + b[l]")
    p.add_code("  A[l] = activation(Z[l])")
    p.add_code("A[0] = X  (input),   A[L] = y_hat  (output)")
    p.add_page_break()

    p.add_chapter("Chapter 4: Loss Functions")
    p.add_section("4.1 Regression")
    p.add_code("MSE:  L = (1/n) * sum((y_pred - y_true)^2)")
    p.add_code("MAE:  L = (1/n) * sum(|y_pred - y_true|)  (robust to outliers)")
    p.add_code("Huber: L = 0.5*delta^2 if |e|<=delta, else delta*(|e|-0.5*delta)")
    p.add_blank()
    p.add_section("4.2 Classification")
    p.add_code("Binary Cross-Entropy:")
    p.add_code("  L = -(1/n) * sum[y*log(p) + (1-y)*log(1-p)]")
    p.add_code("Categorical Cross-Entropy:")
    p.add_code("  L = -(1/n) * sum_i sum_c y_ic * log(p_ic)")
    p.add_page_break()

    p.add_chapter("Chapter 5: Backpropagation")
    p.add_section("5.1 Intuition")
    p.add_body("Backprop computes the gradient of the loss with respect to every weight")
    p.add_body("by applying the chain rule from output back to input.")
    p.add_blank()
    p.add_section("5.2 Chain Rule")
    p.add_code("dL/dW[l] = dL/dA[l] * dA[l]/dZ[l] * dZ[l]/dW[l]")
    p.add_code("         = delta[l] * A[l-1]^T")
    p.add_blank()
    p.add_section("5.3 Gradient Update")
    p.add_code("W[l] = W[l] - alpha * dL/dW[l]")
    p.add_code("b[l] = b[l] - alpha * dL/db[l]")
    p.add_blank()
    p.add_section("5.4 Vanishing Gradient Problem")
    p.add_body("Sigmoid/tanh gradients approach 0 for large |z| -> slow learning in deep nets.")
    p.add_body("Solutions: ReLU, residual connections (ResNets), batch normalisation.")
    p.add_page_break()

    p.add_chapter("Chapter 6: Optimizers")
    p.add_section("6.1 Stochastic Gradient Descent (SGD)")
    p.add_code("theta = theta - alpha * gradient(L; one sample)")
    p.add_body("High variance, noisy updates. Can escape local minima.")
    p.add_blank()
    p.add_section("6.2 Mini-Batch Gradient Descent")
    p.add_code("theta = theta - alpha * gradient(L; mini-batch of size B)")
    p.add_body("Balances variance and computation. Typical batch size: 32-256.")
    p.add_blank()
    p.add_section("6.3 Momentum")
    p.add_code("v = beta*v + (1-beta)*gradient")
    p.add_code("theta = theta - alpha * v")
    p.add_body("Accelerates in consistent directions, dampens oscillations.")
    p.add_blank()
    p.add_section("6.4 Adam (Adaptive Moment Estimation)")
    p.add_code("m = beta1*m + (1-beta1)*g           # 1st moment (mean)")
    p.add_code("v = beta2*v + (1-beta2)*g^2         # 2nd moment (variance)")
    p.add_code("m_hat = m/(1-beta1^t)")
    p.add_code("v_hat = v/(1-beta2^t)")
    p.add_code("theta = theta - alpha * m_hat / (sqrt(v_hat) + eps)")
    p.add_body("Default: beta1=0.9, beta2=0.999, alpha=0.001. Most widely used.")
    p.add_page_break()

    p.add_chapter("Chapter 7: Regularization")
    p.add_section("7.1 L2 Weight Decay")
    p.add_code("L_total = L_data + lambda/2 * sum(w_i^2)")
    p.add_body("Penalises large weights. Encourages small, distributed weights.")
    p.add_blank()
    p.add_section("7.2 L1 Regularization")
    p.add_code("L_total = L_data + lambda * sum(|w_i|)")
    p.add_body("Promotes sparsity: many weights become exactly zero.")
    p.add_blank()
    p.add_section("7.3 Dropout")
    p.add_code("During training: randomly zero out each neuron with prob p.")
    p.add_code("During inference: multiply all weights by (1-p).")
    p.add_body("Forces network to learn redundant representations.")
    p.add_blank()
    p.add_section("7.4 Batch Normalization")
    p.add_code("x_norm = (x - mean_batch) / std_batch")
    p.add_code("y = gamma * x_norm + beta")
    p.add_body("Reduces internal covariate shift, allows higher learning rates.")
    p.add_blank()
    p.add_section("7.5 Early Stopping")
    p.add_body("Monitor validation loss. Stop training when it stops improving.")
    p.add_body("Save best model checkpoint during training.")
    p.add_page_break()

    p.add_chapter("Chapter 8: Modern Architectures")
    p.add_section("8.1 Convolutional Neural Networks (CNNs)")
    p.add_body("Designed for grid-like data (images, time series).")
    p.add_code("Convolution: filter slides over input, computing dot products.")
    p.add_code("Pooling: max/average over spatial region (reduces dimensionality).")
    p.add_body("Famous: LeNet -> AlexNet -> VGG -> ResNet -> EfficientNet.")
    p.add_blank()
    p.add_section("8.2 Recurrent Neural Networks (RNNs)")
    p.add_body("Process sequential data with hidden state memory.")
    p.add_code("h_t = activation(W_h * h_{t-1} + W_x * x_t + b)")
    p.add_body("Suffers from vanishing gradients for long sequences.")
    p.add_blank()
    p.add_section("8.3 LSTM")
    p.add_body("Long Short-Term Memory. Introduces gates to control memory.")
    p.add_code("Forget gate: what to forget from cell state.")
    p.add_code("Input gate:  what new information to store.")
    p.add_code("Output gate: what to output from cell state.")
    p.add_blank()
    p.add_section("8.4 Transformers")
    p.add_body("Attention-based architecture. No recurrence needed.")
    p.add_code("Self-attention: Attention(Q,K,V) = softmax(QK^T/sqrt(d_k))V")
    p.add_body("Multi-head attention: run h attention heads in parallel.")
    p.add_body("Powers: BERT, GPT, T5, ViT, and virtually all modern LLMs.")

    return p.build()


# ─────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────


# Alias so the RESOURCES list can reference it by the expected name
build_linear_algebra_full_pdf = build_linear_algebra_pdf

RESOURCES = [
    {
        "title":       "Python Basics - Variables & Loops",
        "subject":     "Programming",
        "description": "Comprehensive Python guide covering variables, loops, functions, and OOP basics.",
        "filename":    "python_basics.pdf",
        "views":       120,
        "likes":       24,
        "builder":     build_python_basics_pdf,
    },
    {
        "title":       "Database Normalization (1NF to 3NF)",
        "subject":     "Database Management Systems",
        "description": "Full textbook on DB normalization — 1NF through BCNF with SQL examples.",
        "filename":    "db_normalization.pdf",
        "views":       85,
        "likes":       42,
        "builder":     build_db_normalization_full_pdf,
    },
    {
        "title":       "React Hooks Cheat Sheet",
        "subject":     "Web Development",
        "description": "In‑depth React Hooks reference covering useState, useEffect, custom hooks and more.",
        "filename":    "react_hooks.pdf",
        "views":       210,
        "likes":       89,
        "builder":     build_react_hooks_full_pdf,
    },
    {
        "title":       "Introduction to Neural Networks",
        "subject":     "Artificial Intelligence",
        "description": "Complete neural‑network theory and practice: perceptrons, backprop, and modern architectures.",
        "filename":    "neural_networks.pdf",
        "views":       56,
        "likes":       12,
        "builder":     build_neural_networks_full_pdf,
    },
    {
        "title":       "Linear Algebra for ML",
        "subject":     "Mathematics",
        "description": "Full‑textbook linear algebra for ML — vectors, matrices, eigenvalues, SVD, and PCA.",
        "filename":    "linear_algebra.pdf",
        "views":       444,
        "likes":       115,
        "builder":     build_linear_algebra_full_pdf,
    },
]





def reseed():
    print("=" * 60)
    print("LearnHub AI - Reseeder (Comprehensive Multi-Page PDFs)")
    print("=" * 60)

    user_resp = supabase.table("users").select("id, name").limit(1).execute()
    if not user_resp.data:
        print("ERROR: No users found. Sign up first via the frontend.")
        return

    user_id   = user_resp.data[0]["id"]
    user_name = user_resp.data[0].get("name", "Unknown")
    print(f"User: {user_name} ({user_id})")

    # Remove all existing resources
    print("\nRemoving all existing resource rows and storage objects...")
    old = supabase.table("resources").select("id, file_url").execute()
    if old.data:
        for r in old.data:
            furl = r.get("file_url", "")
            MARKER = "/object/public/resources/"
            if MARKER in furl:
                from urllib.parse import unquote
                sp = unquote(furl.split(MARKER, 1)[1])
                try:
                    supabase.storage.from_("resources").remove([sp])
                except Exception as se:
                    print(f"  Warning storage delete: {se}")
        supabase.table("resources").delete().in_(
            "id", [r["id"] for r in old.data]
        ).execute()
        print(f"  Removed {len(old.data)} old rows.")

    success = 0
    for res in RESOURCES:
        resource_id   = str(uuid.uuid4())
        storage_path  = f"{user_id}/{resource_id}/{res['filename']}"

        print(f"\n[{res['title']}]")
        pdf_bytes = res["builder"]()
        print(f"  Pages generated. PDF size: {len(pdf_bytes):,} bytes")

        try:
            supabase.storage.from_("resources").upload(
                path=storage_path,
                file=pdf_bytes,
                file_options={"content-type": "application/pdf"},
            )
            file_url = supabase.storage.from_("resources").get_public_url(storage_path)
            print(f"  Uploaded to storage.")
        except Exception as e:
            print(f"  ERROR uploading: {e}")
            continue

        try:
            db_resp = supabase.table("resources").insert({
                "id":          resource_id,
                "title":       res["title"],
                "subject":     res["subject"],
                "description": res["description"],
                "file_url":    file_url,
                "uploaded_by": user_id,
                "views":       res["views"],
                "likes":       res["likes"],
            }).execute()

            if db_resp.data:
                print(f"  DB row inserted. ID: {resource_id}")
                success += 1
            else:
                print(f"  DB insert returned no data.")
        except Exception as e:
            print(f"  ERROR inserting: {e}")

    print(f"\n{'='*60}")
    print(f"Done! {success}/{len(RESOURCES)} resources seeded.")


if __name__ == "__main__":
    reseed()
