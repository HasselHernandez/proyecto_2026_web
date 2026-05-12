import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button, Alert, Spinner } from "react-bootstrap";
import { supabase } from "../database/supabaseconfig";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import TablaProductos from "../components/productos/TablaProductos";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import TarjetaProductos from "../components/productos/TarjetaProductos";
import Paginacion from "../components/ordenamiento/Paginacion";

const Productos = () => {
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5);

  const [categorias, setCategorias] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const productosPaginados = productosFiltrados.slice(
  (paginaActual - 1) * registrosPorPagina,
  paginaActual * registrosPorPagina
);


  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    archivo: null,
  });

  const [productoEditar, setProductoEditar] = useState({
    id_producto: "",
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    url_imagen: "",
    archivo: null,
  });

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setProductoEditar((prev) => ({...prev,[name]: value,
    }));
  };

  const manejoCambioArchivoActualizar = (e) => {
    const archivo = e.target.files[0]; 
    if (archivo && archivo.type.startsWith("image/")) {
      setProductoEditar((prev) => ({ ...prev, archivo }));
    } else {
      alert("Selecciona una imagen válida (JPG, PNG, etc.)");
    }
  };

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({ ...prev, [name]: value }));
  };

  const manejoCambioArchivo = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type.startsWith("image/")) {
      setNuevoProducto((prev) => ({ ...prev, archivo }));
    } else {
      alert("Selecciona una imagen válida (JPG, PNG, etc.)");
    }
  };

  const manejarCambioBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtrados = productos.filter((prod) => {
        const nombre = prod.nombre_producto?.toLowerCase() || "";
        const descripcion = prod.descripcion_producto?.toLowerCase() || "";
        const precio = prod.precio_venta?.toString() || "";
        return (
          nombre.includes(textoLower) ||
          descripcion.includes(textoLower) ||
          precio.includes(textoLower)
        );
      });
      setProductosFiltrados(filtrados);
    }
  }, [textoBusqueda, productos]);

  useEffect(() => {
    cargarCategorias();
    cargarProductos();
  }, []);

  const abrirModalEdicion = (producto) => {
    setProductoEditar({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      descripcion_producto: producto.descripcion_producto,
      categoria_producto: producto.categoria_producto,
      precio_venta: producto.precio_venta,
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (producto) => {
    setProductoAEliminar(producto);
    setMostrarModalEliminacion(true);
  };

  const actualizarProducto = async () => {
  try {
    if (
      !productoEditar.nombre_producto.trim() ||
      !productoEditar.categoria_producto ||
      !productoEditar.precio_venta
    ) {
      setToast({
        mostrar: true,
        mensaje: "Completa los campos obligatorios",
        tipo: "advertencia",
      });
      return;
    }

    setMostrarModalEdicion(false);

    let datosActualizados = {
      nombre_producto: productoEditar.nombre_producto,
      descripcion_producto: productoEditar.descripcion_producto || null,
      categoria_producto: productoEditar.categoria_producto,
      precio_venta: parseFloat(productoEditar.precio_venta),
      url_imagen: productoEditar.url_imagen,
    };

    if (productoEditar.archivo) {
      const nombreArchivo = `${Date.now()}_${productoEditar.archivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_productos")
        .upload(nombreArchivo, productoEditar.archivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagenes_productos")
        .getPublicUrl(nombreArchivo);

      datosActualizados.url_imagen = urlData.publicUrl;

      if (productoEditar.url_imagen) {
        const nombreAnterior = productoEditar.url_imagen.split("/").pop().split("?")[0];
        await supabase.storage.from("imagenes_productos").remove([nombreAnterior]).catch(() => {});
      }
    }

    const { error } = await supabase
      .from("productos")
      .update(datosActualizados)
      .eq("id_producto", productoEditar.id_producto);

    if (error) throw error;

    await cargarProductos();

    setProductoEditar({
      id_producto: "",
      nombre_producto: "",
      descripcion_producto: "",
      categoria_producto: "",
      precio_venta: "",
      url_imagen: "",
      archivo: null,
    });

    setToast({ mostrar: true, mensaje: "Producto actualizado correctamente", tipo: "exito" });
  } catch (err) {
    console.error("Error al actualizar:", err);
    setToast({ mostrar: true, mensaje: "Error al actualizar producto", tipo: "error" });
  }
};

  const eliminarProducto = async () => {
    if (!productoAEliminar) return;
    try {
      setMostrarModalEliminacion(false);
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_producto", productoAEliminar.id_producto)
        .select();

      if (error) {
        console.error("Error al eliminar el producto:", error.message);
        setToast({
          mostrar: true,
          mensaje: `Error al eliminar el producto "${productoAEliminar.nombre_producto}": ${error.message}`,
          tipo: "error",
        });
        return;
      }

      await cargarProductos();
      setToast({
        mostrar: true,
        mensaje: `Producto "${productoAEliminar.nombre_producto}" eliminado exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Excepción al eliminar el producto:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al eliminar el producto.",
        tipo: "error",
      });
      console.error("Error al eliminar el producto:", err.message);
    }
  };


  const cargarProductos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("id_producto", { ascending: true });
      if (error) {
        console.error("Error al cargar productos:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al cargar productos.",
          tipo: "error",
        });
        return;
      }
      setProductos(data || []);
    } catch (err) {
      console.error("Excepción al cargar productos:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al cargar productos.",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };


  const cargarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("id_categoria", { ascending: true });

      if (error) throw error;
      setCategorias(data || []);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
    }
  };


  const agregarProducto = async () => {
    try {
      if (
        !nuevoProducto.nombre_producto.trim() ||
        !nuevoProducto.categoria_producto ||
        !nuevoProducto.precio_venta ||
        !nuevoProducto.archivo
      ) {
        setToast({
          mostrar: true,
          mensaje: "Completa los campos obligatorios (nombre, categoría, precio e imagen)",
          tipo: "advertencia",
        });
        return;
      }

      setMostrarModal(false);

      const nombreArchivo = `${Date.now()}_${nuevoProducto.archivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("imagenes_productos")
        .upload(nombreArchivo, nuevoProducto.archivo);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("imagenes_productos")
        .getPublicUrl(nombreArchivo);
      const urlPublica = urlData.publicUrl;

      const { error } = await supabase.from("productos").insert([
        {
          nombre_producto: nuevoProducto.nombre_producto,
          descripcion_producto: nuevoProducto.descripcion_producto || null,
          categoria_producto: nuevoProducto.categoria_producto,
          precio_venta: parseFloat(nuevoProducto.precio_venta),
          url_imagen: urlPublica,
        },
      ]);

      if (error) throw error;

      await cargarProductos();

      setNuevoProducto({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        archivo: null,
      });

      setToast({ mostrar: true, mensaje: "Producto registrado correctamente", tipo: "exito" });
    } catch (err) {
      console.error("Error al agregar producto:", err);
      setToast({ mostrar: true, mensaje: "Error al registrar producto", tipo: "error" });
    }
  };


  return (
    <Container className="mt-3">
      <Row className="align-items-center mb-3">
        <Col className="d-flex align-items-center">
          <h3 className="mb-0">
            <i className="bi-bag-heart-fill me-2"></i> Productos
          </h3>
        </Col>

        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button onClick={() => setMostrarModal(true)} size="md">
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
          </Button>
        </Col>
      </Row>

      <hr />

      {/* Cuadro de búsqueda debajo de la línea divisoria */}
      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarCambioBusqueda}
            placeholder="Buscar por nombre o descripción..."
          />
        </Col>
      </Row>

      <Col xs={12} md={12} lg={12}>
  {/* Spinner de carga de productos */}
  {cargando && (
    <div className="text-center my-5">
      <Spinner animation="border" variant="success" size="lg" />
      <p className="mt-3 text-muted">Cargando productos...</p>
    </div>
  )}
</Col>


      {/* Mensaje de no coincidencias solo cuando hay búsqueda y no hay resultados */}
      {!cargando && textoBusqueda.trim() && productosFiltrados.length === 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="info" className="text-center">
              <i className="bi bi-info-circle me-2"></i>
              No se encontraron productos que coincidan con "{textoBusqueda}".
            </Alert>
          </Col>
        </Row>
      )}

      {/* Paginación */}
      {productosPaginados.length > 0 && (
        <Paginacion
          registrosPorPagina={registrosPorPagina}
          totalRegistros={productosFiltrados.length}
          paginaActual={paginaActual}
          establecerPaginaActual={setPaginaActual}
          establecerRegistrosPorPagina={setRegistrosPorPagina}
        />
      )}

      {/* Lista de productos filtrados */}
      {!cargando && productosPaginados.length > 0 && (
        <Row>
          <Col xs={12} sm={12} md={12} className="d-lg-none">
            <TarjetaProductos
              productos={productosPaginados}
              categorias={categorias}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
          </Col>
          <Col lg={12} className="d-none d-lg-block">
            <TablaProductos
              productos={productosPaginados}
              categorias={categorias}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
            />
          </Col>
        </Row>
      )}

      {/* Modales */}

      <ModalRegistroProducto
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoProducto={nuevoProducto}
        manejoCambioInput={manejoCambioInput}
        manejoCambioArchivo={manejoCambioArchivo}
        agregarProducto={agregarProducto}
        categorias={categorias}
      />

      {/* Modal de Edición */}
      <ModalEdicionProducto
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        productoEditar={productoEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        manejoCambioArchivoActualizar={manejoCambioArchivoActualizar}
        actualizarProducto={actualizarProducto}
        categorias={categorias}
      />

      {/* Modal de Eliminación */}
      <ModalEliminacionProducto
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarProducto={eliminarProducto}
        productoAEliminar={productoAEliminar}
      />

      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>

  );
};

export default Productos;