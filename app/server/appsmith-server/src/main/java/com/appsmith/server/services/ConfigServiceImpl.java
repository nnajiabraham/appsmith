package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.ConfigRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Collections;
import java.util.List;

import static org.apache.commons.lang3.ObjectUtils.defaultIfNull;

@Slf4j
@Service
public class ConfigServiceImpl implements ConfigService {

    private static final String TEMPLATE_ORGANIZATION_CONFIG_NAME = "template-organization";

    private final ApplicationRepository applicationRepository;
    private final DatasourceRepository datasourceRepository;
    private final ConfigRepository repository;

    // This is permanently cached through the life of the JVM process as this is not intended to change at runtime ever.
    private String instanceId = null;

    public ConfigServiceImpl(ConfigRepository repository,
                             ApplicationRepository applicationRepository,
                             DatasourceRepository datasourceRepository) {
        this.applicationRepository = applicationRepository;
        this.datasourceRepository = datasourceRepository;
        this.repository = repository;
    }

    @Override
    public Mono<Config> getByName(String name) {
        return repository.findByName(name)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)));
    }

    @Override
    public Mono<Config> updateByName(String name, Config config) {
        return repository.findByName(name)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.CONFIG, name)))
                .flatMap(dbConfig -> {
                    log.debug("Found config with name: {} and id: {}", name, dbConfig.getId());
                    dbConfig.setConfig(config.getConfig());
                    return repository.save(dbConfig);
                });
    }

    @Override
    public Mono<String> getInstanceId() {
        if (instanceId != null) {
            return Mono.just(instanceId);
        }

        return getByName("instance-id")
                .map(config -> {
                    instanceId = config.getConfig().getAsString("value");
                    return instanceId;
                });
    }

    @Override
    public Mono<String> getTemplateOrganizationId() {
        return repository.findByName(TEMPLATE_ORGANIZATION_CONFIG_NAME)
                .filter(config -> config.getConfig() != null)
                .flatMap(config -> Mono.justOrEmpty(config.getConfig().getAsString(FieldName.ORGANIZATION_ID)))
                .doOnError(error -> log.warn("Error getting template organization ID", error));
    }

    @Override
    public Flux<Application> getTemplateApplications() {
        return repository.findByName(TEMPLATE_ORGANIZATION_CONFIG_NAME)
                .filter(config -> config.getConfig() != null)
                .map(config -> defaultIfNull(
                        config.getConfig().getOrDefault("applicationIds", null),
                        Collections.emptyList()
                ))
                .cast(List.class)
                .onErrorReturn(Collections.emptyList())
                .flatMapMany(applicationRepository::findByIdIn);
    }

    @Override
    public Flux<Datasource> getTemplateDatasources() {
        return repository.findByName(TEMPLATE_ORGANIZATION_CONFIG_NAME)
                .filter(config -> config.getConfig() != null)
                .map(config -> defaultIfNull(
                        config.getConfig().getOrDefault("datasourceIds", null),
                        Collections.emptyList()
                ))
                .cast(List.class)
                .onErrorReturn(Collections.emptyList())
                .flatMapMany(datasourceRepository::findByIdIn);
    }

}
