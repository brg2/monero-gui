# Copy mobile wallet web app resources
if (${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    file(COPY webwallet DESTINATION ${CMAKE_BINARY_DIR}/bin/monero-wallet-gui.app/Contents/MacOS)
else()
    file(COPY webwallet DESTINATION ${CMAKE_BINARY_DIR}/bin)
endif()
