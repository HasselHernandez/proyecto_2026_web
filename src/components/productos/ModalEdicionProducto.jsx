import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const ModalEdicionProducto = ({
    mostrarModalEdicion,
    setMostrarModalEdicion,
    productoEditar,
    manejoCambioInputEdicion,
    actualizarProducto,
    categorias
}) => {
    const [deshabilitado, setDeshabilitado] = useState(false);

    const handleActualizar = async () => {
        if (deshabilitado) return;
        setDeshabilitado(true);
        await actualizarProducto();
        setDeshabilitado(false);
    };

    return (
        <Modal
            show={mostrarModalEdicion}
            onHide={() => setMostrarModalEdicion(false)}
            backdrop="static"
            keyboard={false}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>Editar Producto</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre_producto"
                            value={productoEditar.nombre_producto}
                            onChange={manejoCambioInputEdicion}
                            placeholder="Ingresa el nombre"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Descripción</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="descripcion_producto"
                            value={productoEditar.descripcion_producto}
                            onChange={manejoCambioInputEdicion}
                            placeholder="Ingresa la descripción"
                        />
                    </Form.Group>

                    {/* Categoría */}
                    <Form.Group className="mb-3">
                        <Form.Label>Categoría</Form.Label>
                        <Form.Select
                            name="categoria_producto"
                            value={productoEditar.categoria_producto || ""}
                            onChange={manejoCambioInputEdicion}
                        >
                            <option value="">Selecciona una categoría</option>
                            {categorias.map((categoria) => (
                                <option
                                    key={categoria.id_categoria}
                                    value={categoria.id_categoria}
                                >
                                    {categoria.nombre_categoria}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {/* Precio */}
                    <Form.Group className="mb-3">
                        <Form.Label>Precio</Form.Label>
                        <Form.Control
                            type="number"
                            name="precio_venta"
                            value={productoEditar.precio_venta || ""}
                            onChange={manejoCambioInputEdicion}
                            placeholder="Ingresa el precio"
                            min="0"
                            step="0.01"
                        />
                    </Form.Group>

                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={() => setMostrarModalEdicion(false)}
                    disabled={deshabilitado}
                >
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleActualizar}
                    disabled={deshabilitado ||
                        !productoEditar.nombre_producto.trim() ||
                        !productoEditar.descripcion_producto.trim() ||
                        !productoEditar.categoria_producto ||
                        !productoEditar.precio_venta ||
                        isNaN(productoEditar.precio_venta)
                    }
                >
                    Actualizar

                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalEdicionProducto;